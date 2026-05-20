import {
  Notification,
  NotificationRecipientType,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "../config/prisma";

export class NotificationRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: Prisma.NotificationCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Notification> {
    const db = this.getClient(tx);

    return db.notification.create({
      data,
    });
  }

  async createMany(
    data: Prisma.NotificationCreateInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.getClient(tx);

    return db.notification.createMany({
      data,
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByRecipient(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        OR: [
          { isGlobal: true },
          {
            recipientType,
            recipientId,
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findWithPagination(params: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    page?: number;
    limit?: number;
    type?: NotificationType;
    isRead?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      OR: [
        { isGlobal: true },
        {
          recipientType: params.recipientType,
          recipientId: params.recipientId,
        },
      ],
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    const [data, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(entityId: string) {
    return prisma.notification.findMany({
      where: { entityId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsUnread(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async markAllAsRead(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { isGlobal: true },
          {
            recipientType,
            recipientId,
          },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async markAllAsUnread(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { isGlobal: true },
          {
            recipientType,
            recipientId,
          },
        ],
        isRead: true,
      },
      data: { isRead: false },
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }

  async deleteByEntity(entityId: string) {
    return prisma.notification.deleteMany({
      where: { entityId },
    });
  }

  async deleteByRecipient(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    return prisma.notification.deleteMany({
      where: {
        recipientType,
        recipientId,
      },
    });
  }
}
