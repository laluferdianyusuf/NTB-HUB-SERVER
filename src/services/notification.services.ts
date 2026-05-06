import {
  Device,
  Notification,
  NotificationRecipientType,
  NotificationType,
  Prisma,
  Role,
} from "@prisma/client";
import { error, success } from "helpers/return";
import { notificationQueue } from "queue/notificationQueue";
import {
  DeviceRepository,
  UserRepository,
  UserRoleRepository,
} from "repositories";
import { NotificationJobData } from "types/notification.types";
import { uploadToCloudinary } from "utils/image";
import { NotificationRepository } from "../repositories/notification.repo";
import firebase from "../utils/firebase";

const notificationRepository = new NotificationRepository();
const userRepository = new UserRepository();

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function ok(message: string, data?: any) {
  return {
    status: true,
    status_code: 200,
    message,
    data,
  };
}

function fail(message: string) {
  return {
    status: false,
    status_code: 500,
    message,
    data: null,
  };
}

export class NotificationService {
  private deviceRepo = new DeviceRepository();
  private userRoleRepo = new UserRoleRepository();

  private async sendFCM(
    tokens: string[],
    payload: Omit<firebase.messaging.MulticastMessage, "tokens">,
  ) {
    if (!tokens.length) return;

    const chunks = chunkArray(tokens, 500);
    const invalidTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const response = await firebase.messaging().sendEachForMulticast({
          tokens: chunk,
          ...payload,
        });

        console.log(`[FCM] sent ${response.successCount}/${chunk.length}`);

        response.responses.forEach((res, i) => {
          if (!res.success) {
            const msg = res.error?.message || "";

            if (
              msg.includes("registration-token-not-registered") ||
              msg.includes("invalid-registration-token")
            ) {
              invalidTokens.push(chunk[i]);
            }
          }
        });
      } catch (err) {
        console.log("[FCM ERROR]", err);
      }
    }

    if (invalidTokens.length) {
      await Promise.all(
        invalidTokens.map((token) => this.deviceRepo.deleteByToken(token)),
      );
      console.log("Deleted invalid tokens:", invalidTokens);
    }
  }

  private extractValidTokens(devices: Device[]) {
    return [
      ...new Set(
        devices.map((d) => d.token).filter((t) => t && typeof t === "string"),
      ),
    ];
  }

  private getTokensFromRolesSafe(roles: any[]) {
    const devices = roles.flatMap((r) => r.user?.devices ?? []);
    return this.extractValidTokens(devices);
  }

  private getTokensFromRoles(roles: any[]) {
    return roles.flatMap(
      (r) => r.user?.devices.map((d: Device) => d.token) ?? [],
    );
  }

  private async sendFCMQueue(
    tokens: string[],
    payload: NotificationJobData["payload"],
  ) {
    if (!tokens.length) return;

    await notificationQueue.add(
      "send-notification",
      {
        tokens,
        payload,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
      },
    );

    return {
      queued: true,
      total: tokens.length,
    };
  }

  private async resolveTokens(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ): Promise<string[]> {
    switch (recipientType) {
      case "USER": {
        const devices = await this.deviceRepo.findByUserId(recipientId);
        return this.extractValidTokens(devices);
      }

      case "VENUE": {
        const roles = await this.userRoleRepo.findUsersByRoleAndVenue(
          Role.VENUE_OWNER,
          recipientId,
        );
        return this.getTokensFromRolesSafe(roles);
      }

      case "EVENT": {
        const roles = await this.userRoleRepo.findUsersByRoleAndEvent(
          Role.EVENT_OWNER,
          recipientId,
        );
        return this.getTokensFromRolesSafe(roles);
      }

      case "COMMUNITY": {
        const members =
          await this.userRoleRepo.findUsersByCommunity(recipientId);
        return this.getTokensFromRolesSafe(members);
      }

      case "ADMIN": {
        const roles = await this.userRoleRepo.findUsersByRole(Role.ADMIN);
        return this.getTokensFromRolesSafe(roles);
      }

      default:
        return [];
    }
  }

  async sendPromotionToAllUsers(params: {
    title: string;
    message: string;
    image?: string;
    data?: Record<string, string>;
  }) {
    const users = await userRepository.findManyUsers();

    const tokens = users.flatMap((u) => u.devices?.map((d) => d.token) ?? []);

    const uniqueTokens = [...new Set(tokens)];

    if (!uniqueTokens.length) return;

    return this.sendFCMQueue(uniqueTokens, {
      notification: {
        title: params.title,
        body: params.message,
        imageUrl: params.image || undefined,
      },
      data: {
        type: "PROMOTION",
        ...params.data,
      },
    });
  }

  async sendNotificationToRecipient(params: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    title: string;
    message: string;
    type?: NotificationType;
    entityId?: string;
    image?: string;
    data?: Record<string, string>;
  }) {
    const {
      recipientType,
      recipientId,
      title,
      message,
      image,
      data,
      type,
      entityId,
    } = params;

    await notificationRepository.create({
      recipientType,
      recipientId,
      title,
      message,
      type: type ? type : "SYSTEM",
      image,
      entityId,
      isGlobal: false,
      adminOnly: false,
    });

    const tokens = await this.resolveTokens(recipientType, recipientId);

    return this.sendFCM(tokens, {
      notification: {
        title,
        body: message,
        imageUrl: image || undefined,
      },
      data: data || {},
    });
  }

  async sendCustomNotifications(
    notifications: {
      recipientType: NotificationRecipientType;
      recipientId: string;
      title: string;
      message: string;
      type: NotificationType;
      entityId?: string;
    }[],
    tx?: Prisma.TransactionClient,
  ) {
    await notificationRepository.createMany(
      notifications.map((n) => ({
        ...n,
        isGlobal: false,
        adminOnly: n.recipientType === "ADMIN",
        image: null,
        userId: n.recipientType === "USER" ? n.recipientId : null,
      })),
      tx,
    );

    await Promise.all(
      notifications.map(async (n) => {
        const tokens = await this.resolveTokens(n.recipientType, n.recipientId);

        if (!tokens.length) return;

        return this.sendFCM(tokens, {
          notification: {
            title: n.title,
            body: n.message,
          },
          data: {
            type: n.type,
            entityId: n.entityId || "",
          },
        });
      }),
    );
  }

  async sendToMultipleRecipients(params: {
    targets: {
      recipientType: NotificationRecipientType;
      recipientId: string;
    }[];

    title: string;
    message: string;
    type: NotificationType;
    entityId?: string;
    image?: string;
    data?: Record<string, string>;
  }) {
    const { targets, title, message, type, entityId, image, data } = params;

    if (!targets.length) return;

    const uniqueTargets = Array.from(
      new Map(
        targets.map((t) => [`${t.recipientType}-${t.recipientId}`, t]),
      ).values(),
    );

    await notificationRepository.createMany(
      uniqueTargets.map((t) => ({
        recipientType: t.recipientType,
        recipientId: t.recipientId,
        title,
        message,
        type,
        entityId: entityId ?? null,
        image: image ?? null,
        isGlobal: false,
        adminOnly: t.recipientType === "ADMIN",
        userId: t.recipientType === "USER" ? t.recipientId : null,
      })),
    );

    let allTokens: string[] = [];

    for (const target of uniqueTargets) {
      const tokens = await this.resolveTokens(
        target.recipientType,
        target.recipientId,
      );

      allTokens.push(...tokens);
    }

    allTokens = [...new Set(allTokens)];

    if (!allTokens.length) return;

    return this.sendFCM(allTokens, {
      notification: {
        title,
        body: message,
        imageUrl: image || undefined,
      },
      data: data || {},
    });
  }

  async sendToVenueOwner(
    venueId: string,
    title: string,
    body: string,
    image?: string | null,
  ) {
    const roles = await this.userRoleRepo.findUsersByRoleAndVenue(
      Role.VENUE_OWNER,
      venueId,
    );

    const tokens = this.getTokensFromRoles(roles);

    return this.sendFCM(tokens, {
      notification: { title, body, imageUrl: image || undefined },
      data: {
        action: "OPEN_VENUE",
        venueId,
      },
    });
  }

  async sendToEventOwner(
    eventId: string,
    title: string,
    body: string,
    image?: string,
  ) {
    const roles = await this.userRoleRepo.findUsersByRoleAndEvent(
      Role.EVENT_OWNER,
      eventId,
    );

    const tokens = this.getTokensFromRoles(roles);

    return this.sendFCM(tokens, {
      notification: { title, body, imageUrl: image || undefined },
      data: {
        action: "OPEN_EVENT",
        eventId,
      },
    });
  }

  async sendToAdmins(title: string, body: string, image?: string) {
    const roles = await this.userRoleRepo.findUsersByRole(Role.ADMIN);
    const tokens = this.getTokensFromRoles(roles);

    return this.sendFCM(tokens, {
      notification: { title, body, imageUrl: image || undefined },
      data: {
        action: "ADMIN_NOTIFICATION",
      },
    });
  }

  async sendToUser(
    venueId: string,
    userId: string,
    title: string,
    body: string,
    image?: string | null,
  ) {
    const devices = await this.deviceRepo.findByUserId(userId);
    const tokens = devices.map((d) => d.token);

    return this.sendFCM(tokens, {
      notification: { title, body, imageUrl: image || undefined },
      data: {
        action: "OPEN_VENUE",
        venueId,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "custom_sound.wav",
        },
      },
      apns: {
        payload: {
          aps: {
            category: "OPEN_VENUE",
            contentAvailable: true,
            sound: "custom_sound.wav",
          },
        },
      },
    });
  }

  async sendToCommunityMembers(
    communityId: string,
    title: string,
    body: string,
    image?: string | null,
  ) {
    const members = await this.userRoleRepo.findUsersByCommunity(communityId);

    const tokens = members.flatMap(
      (m) => m.user?.devices.map((d) => d.token) ?? [],
    );

    return this.sendFCMQueue(tokens, {
      notification: {
        title,
        body,
        imageUrl: image || undefined,
      },
      data: {
        action: "OPEN_COMMUNITY",
        communityId,
      },
    });
  }

  async sendMentionNotification(params: {
    mentionedUserId: string;
    actorId: string;
    actorName: string;
    communityId: string;
    postId: string;
  }) {
    const { mentionedUserId, actorId, actorName, communityId } = params;

    if (mentionedUserId === actorId) return;

    const notification = await notificationRepository.create({
      recipientId: mentionedUserId,
      recipientType: "USER",
      entityId: mentionedUserId,
      title: "Kamu di-mention",
      message: `${actorName} menyebut kamu di postingan komunitas`,
      type: "SYSTEM",
    } as Notification);

    await this.sendToUser(
      communityId,
      mentionedUserId,
      "Kamu di-mention",
      `${actorName} menyebut kamu di postingan komunitas`,
    );

    return ok("Mention notification sent", notification);
  }

  async sendNotification(data: Notification, file?: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file?.path) {
        imageUrl = await uploadToCloudinary(file.path, "notifications");
      }

      const created = await notificationRepository.create({
        ...data,
        image: imageUrl,
      });

      return {
        status: true,
        status_code: 201,
        message: "Notification sent",
        data: created,
      };
    } catch {
      return fail("Failed to send notification");
    }
  }

  async markAllAsRead(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const items = await notificationRepository.markAllAsRead(
      recipientType,
      recipientId,
    );

    return items;
  }

  async markAllAsUnread(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const items = await notificationRepository.markAllAsUnread(
      recipientType,
      recipientId,
    );

    return items;
  }

  async getNotificationByRecipient(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const result = await notificationRepository.findByRecipient(
      recipientType,
      recipientId,
    );

    return result;
  }

  async getUserNotifications(userId: string, page?: number, limit?: number) {
    const result = await notificationRepository.findByEntity(userId);

    return result;
  }

  async getNotificationByVenue(entityId: string) {
    try {
      const notification = await notificationRepository.findByEntity(entityId);

      if (!notification) {
        return error.error404("Notification not found");
      }

      return success.success200("Notification retrieved", notification);
    } catch (err) {
      return error.error500("Internal server error " + err);
    }
  }

  async sendToCommunityMembersAdvanced(
    communityId: string,
    title: string,
    body: string,
    options?: {
      image?: string | null;
      roleFilter?: string;
      onlyActive?: boolean;
    },
  ) {
    const { image, roleFilter, onlyActive } = options || {};

    const members = await this.userRoleRepo.findUsersByCommunity(communityId);

    let filtered = members;

    if (roleFilter) {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }

    if (onlyActive) {
      filtered = filtered.filter((m) => m.user?.isVerified);
    }

    const tokens = this.getTokensFromRolesSafe(filtered);

    if (!tokens.length) return;

    return this.sendFCMQueue(tokens, {
      notification: {
        title,
        body,
        imageUrl: image || undefined,
      },
      data: {
        action: "MULTI_TARGET",
      },
    });
  }

  async sendToMultipleTargets(params: {
    title: string;
    body: string;
    image?: string;

    venueId?: string;
    eventId?: string;
    communityId?: string;
    userIds?: string[];

    role?: Role;
  }) {
    const { title, body, image, venueId, eventId, communityId, userIds, role } =
      params;

    let tokens: string[] = [];

    if (venueId) {
      const roles = await this.userRoleRepo.findUsersByRoleAndVenue(
        role || Role.VENUE_OWNER,
        venueId,
      );

      tokens.push(...this.getTokensFromRolesSafe(roles));
    }

    if (eventId) {
      const roles = await this.userRoleRepo.findUsersByRoleAndEvent(
        role || Role.EVENT_OWNER,
        eventId,
      );

      tokens.push(...this.getTokensFromRolesSafe(roles));
    }

    if (communityId) {
      const members = await this.userRoleRepo.findUsersByCommunity(communityId);

      tokens.push(...this.getTokensFromRolesSafe(members));
    }

    if (userIds?.length) {
      const devices = await Promise.all(
        userIds.map((id) => this.deviceRepo.findByUserId(id)),
      );

      tokens.push(...this.extractValidTokens(devices.flat()));
    }

    tokens = [...new Set(tokens)];

    if (!tokens.length) return;

    return this.sendFCM(tokens, {
      notification: {
        title,
        body,
        imageUrl: image || undefined,
      },
      data: {
        action: "MULTI_TARGET",
      },
    });
  }
}
