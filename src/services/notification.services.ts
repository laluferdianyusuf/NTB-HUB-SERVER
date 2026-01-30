import firebase from "../utils/firebase";
import { Notification } from "@prisma/client";
import { NotificationRepository } from "../repositories/notification.repo";
import { uploadToCloudinary } from "utils/image";
import { DeviceRepository } from "repositories";
import { error, success } from "helpers/return";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  private deviceRepo = new DeviceRepository();

  async sendToUser(
    venueId: string,
    userId: string,
    title: string,
    body: string,
    image?: string,
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

  async sendToVenue(
    venueId: string,
    title: string,
    body: string,
    image?: string,
  ) {
    const devices = await this.deviceRepo.findByVenueId(venueId);

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
    console.log(
      `FCM → Venue ${venueId}: ${response.successCount}/${tokens.length}`,
    );

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

  async sendToAdmin(title: string, body: string, image?: string) {
    const devices = await this.deviceRepo.findAdmins();

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
        action: "ADMIN_NOTIFICATION",
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
            category: "ADMIN_NOTIFICATION",
            contentAvailable: true,
            sound: "custom_sound.wav",
          },
        },
      },
    };

    const response = await firebase.messaging().sendEachForMulticast(message);
    console.log(`FCM → Admins: ${response.successCount}/${tokens.length}`);

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
