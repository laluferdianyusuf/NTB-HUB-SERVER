import { Notification } from "@prisma/client";
import { NotificationRepository } from "../repositories/notification.repo";
import { publisher } from "config/redis.config";
import { uploadToCloudinary } from "utils/image";

const notificationRepository = new NotificationRepository();

export class NotificationService {
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
