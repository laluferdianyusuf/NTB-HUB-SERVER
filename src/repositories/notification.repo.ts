import {
  PrismaClient,
  Notification as PrismaNotification,
} from "@prisma/client";
import { Notification } from "../../models/notification.model";

const prisma = new PrismaClient();

export class NotificationRepository {
  // find all notification
  async findNotificationByUserId(
    userId: string
  ): Promise<PrismaNotification[]> {
    return prisma.notification.findMany({ where: { userId } });
  }

  //   create new notification
  async createNewNotification(data: Notification): Promise<PrismaNotification> {
    return prisma.notification.create({
      data,
    });
  }

  // update notification as read
  async updateNotification(
    id: string,
    isRead: boolean
  ): Promise<PrismaNotification> {
    return prisma.notification.update({ where: { id: id }, data: { isRead } });
  }

  // delete notification
  async deleteNotification(id: string): Promise<PrismaNotification> {
    return prisma.notification.delete({ where: { id: id } });
  }
}
