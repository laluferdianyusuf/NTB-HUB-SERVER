import firebase from "../utils/firebase";
import { Notification, Role } from "@prisma/client";
import { NotificationRepository } from "../repositories/notification.repo";
import { uploadToCloudinary } from "utils/image";
import { DeviceRepository, UserRoleRepository } from "repositories";
import { error, success } from "helpers/return";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  private deviceRepo = new DeviceRepository();
  private userRoleRepo = new UserRoleRepository();

  private async sendFCM(
    tokens: string[],
    payload: firebase.messaging.MulticastMessage,
  ) {
    if (!tokens.length) return;

    const response = await firebase.messaging().sendEachForMulticast(payload);

    const invalidTokens: string[] = [];
    response.responses.forEach((res, i) => {
      if (!res.success) {
        const msg = res.error?.message || "";
        if (
          msg.includes("registration-token-not-registered") ||
          msg.includes("invalid-registration-token")
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    if (invalidTokens.length) {
      await Promise.all(
        invalidTokens.map((token) => this.deviceRepo.deleteByToken(token)),
      );
    }

    return response;
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

    const tokens = roles.flatMap(
      (r) => r.user?.devices.map((d) => d.token) ?? [],
    );

    return this.sendFCM(tokens, {
      tokens,
      notification: { title, body, imageUrl: String(image) },
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

    const tokens = roles.flatMap(
      (r) => r.user?.devices.map((d) => d.token) ?? [],
    );

    return this.sendFCM(tokens, {
      tokens,
      notification: { title, body, imageUrl: image },
      data: {
        action: "OPEN_EVENT",
        eventId,
      },
    });
  }

  async sendToAdmins(title: string, body: string, image?: string) {
    const roles = await this.userRoleRepo.findUsersByRole(Role.ADMIN);

    const tokens = roles.flatMap(
      (r) => r.user?.devices.map((d) => d.token) ?? [],
    );

    return this.sendFCM(tokens, {
      tokens,
      notification: { title, body, imageUrl: image },
      data: {
        action: "ADMIN_NOTIFICATION",
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
    const { mentionedUserId, actorId, actorName, communityId, postId } = params;

    if (mentionedUserId === actorId) return;

    const notification = await notificationRepository.createNewNotification({
      userId: mentionedUserId,
      title: "Kamu di-mention",
      message: `${actorName} menyebut kamu di postingan komunitas`,
      type: "MENTION",
    } as Notification);

    await this.sendToUser(
      communityId,
      mentionedUserId,
      "Kamu di-mention",
      `${actorName} menyebut kamu di postingan komunitas`,
    );

    return notification;
  }

  async sendToUser(
    venueId: string,
    userId: string,
    title: string,
    body: string,
    image?: string | null,
  ) {
    const devices = await this.deviceRepo.findByUserId(userId);

    if (!devices.length) return;

    const tokens = devices.map((d) => d.token);

    const message: firebase.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        imageUrl: image || undefined,
      },
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
    };

    const response = await firebase.messaging().sendEachForMulticast(message);

    console.log(`FCM sent → ${response.successCount}/${tokens.length}`);

    const invalidTokens: string[] = [];

    response.responses.forEach((res, i) => {
      if (!res.success) {
        const msg = res.error?.message || "";
        if (
          msg.includes("registration-token-not-registered") ||
          msg.includes("invalid-registration-token")
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    if (invalidTokens.length) {
      await Promise.all(
        invalidTokens.map((token) => this.deviceRepo.deleteByToken(token)),
      );
      console.log("Deleted invalid tokens:", invalidTokens);
    }

    return response;
  }

  async sendNotification(data: Notification, file?: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "notifications");
      }
      const created = await notificationRepository.createNewNotification({
        ...data,
        image: imageUrl,
      });
      return {
        status: true,
        status_code: 201,
        message: "Notification sent",
        data: created,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to send notification",
        data: null,
      };
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const items = await notificationRepository.markAllAsRead(userId);

      return {
        status: true,
        status_code: 200,
        message: "All notifications marked as read",
        data: {
          items,
        },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to mark notifications as read",
        data: null,
      };
    }
  }

  async markAllAsUnread(userId: string) {
    try {
      const items = await notificationRepository.markAllAsUnread(userId);

      return {
        status: true,
        status_code: 200,
        message: "All notifications marked as unread",
        data: {
          items,
        },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to mark notifications as unread",
        data: null,
      };
    }
  }

  async getUserNotifications(userId: string, page?: number, limit?: number) {
    try {
      const result = await notificationRepository.findNotificationsForUser(
        userId,
        page,
        limit,
      );

      return {
        status: true,
        status_code: 200,
        message: "Notifications fetched successfully",
        data: {
          items: result.items,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
          },
        },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to get notification",
        data: null,
      };
    }
  }

  async getGroupedNotifications(userId: string) {
    try {
      const [global, personal] = await Promise.all([
        notificationRepository.findGlobal(),
        notificationRepository.findPersonal(userId),
      ]);

      return {
        status: true,
        status_code: 200,
        message: "Notifications fetched successfully",
        data: {
          forYou: global,
          personal: personal,
        },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to get notification",
        data: null,
      };
    }
  }

  async getNotificationByVenue(venueId: string) {
    try {
      const notification =
        await notificationRepository.findPersonalVenue(venueId);

      if (!notification) {
        return error.error404("Notification not found");
      }

      return success.success200("Notification retrieved", notification);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
