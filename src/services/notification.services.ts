import firebase from "../utils/firebase";
import { Notification } from "@prisma/client";
import { NotificationRepository } from "../repositories/notification.repo";
import { publisher } from "config/redis.config";
import { uploadToCloudinary } from "utils/image";
import { DeviceRepository } from "repositories";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  private deviceRepo = new DeviceRepository();

  async sendToUser(
    venueId: string,
    userId: string,
    title: string,
    body: string,
    image?: string
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

    response.responses.forEach((res, i) => {
      if (!res.success) {
        const error = res.error?.message || "";
        if (
          error.includes("registration-token-not-registered") ||
          error.includes("invalid-registration-token")
        ) {
          const invalid = tokens[i];
          this.deviceRepo.deleteByToken(invalid);
          console.log("Deleted invalid token:", invalid);
        }
      }
    });

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

  async getUserNotifications(userId: string) {
    try {
      const notifications =
        await notificationRepository.findNotificationByUserId(userId);
      return {
        status: true,
        status_code: 200,
        message: "Notifications retrieved",
        data: notifications,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to get notifications",
        data: null,
      };
    }
  }

  async markAsRead(id: string) {
    try {
      const notification = await notificationRepository.updateNotification(
        id,
        true
      );

      await publisher.publish(
        "notification-events",
        JSON.stringify({
          event: "notification:read",
          payload: notification.isRead,
        })
      );
      return {
        status: true,
        status_code: 200,
        message: "Notification marked as read",
        data: notification,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to mark as read",
        data: null,
      };
    }
  }
}
