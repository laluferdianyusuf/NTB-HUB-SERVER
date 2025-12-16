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
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        OR: [{ isGlobal: true }, { userId }],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async markAllAsUnread(userId: string) {
    return prisma.notification.updateMany({
      where: {
        OR: [{ isGlobal: true }, { userId }],
        isRead: true,
      },
      data: { isRead: false },
    });
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

  async findManyByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        OR: [{ isGlobal: true }, { userId: userId }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findNotificationsForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          OR: [{ isGlobal: true }, { userId }],
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where: {
          OR: [{ isGlobal: true }, { userId }],
        },
      }),
    ]);

    return { items, total, page, limit };
  }

  async findGlobal() {
    return prisma.notification.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPersonal(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPersonalVenue(venueId: string) {
    return prisma.notification.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
    });
  }
}
