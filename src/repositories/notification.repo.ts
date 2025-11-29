import { Prisma, PrismaClient, Notification } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationRepository {
  // find all notification
  async findNotificationByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({ where: { userId } });
  }

  //   create new notification
  async createNewNotification(data: Notification): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  // update notification as read
  async updateNotification(id: string, isRead: boolean): Promise<Notification> {
    return prisma.notification.update({ where: { id: id }, data: { isRead } });
  }

  // delete notification
  async deleteNotification(id: string): Promise<Notification> {
    return prisma.notification.delete({ where: { id: id } });
  }

  async createManyNotification(
    data: Omit<Notification, "id" | "createdAt" | "updatedAt" | "isRead">[],
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return await db.notification.createMany({ data });
  }
}
