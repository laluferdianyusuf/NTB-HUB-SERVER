import { EventOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityEventOrderRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            status: true,
            ticketType: true,
            ticketTypeId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
        communityEvent: {
          select: {
            id: true,
            endAt: true,
            startAt: true,
            title: true,
            image: true,
            description: true,
            location: true,

            community: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findByQrCode(qrCode: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.findUnique({
      where: { qrCode },
    });
  }

  async lockOrder(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return await db.communityEventOrder.update({
      where: { id: id },
      data: {
        isCheckedIn: true,
        checkedInAt: new Date(),
      },
    });
  }

  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.findMany({
      where: { userId },
      include: {
        tickets: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        communityEvent: {
          select: {
            id: true,
            endAt: true,
            startAt: true,
            title: true,
            image: true,
            description: true,
            location: true,
            community: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findByIdempotencyKey(key: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async create(
    data: {
      id: string;
      userId: string;
      communityEventId: string;
      total: number;
      status: EventOrderStatus;
      qrCode: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).communityEventOrder.create({
      data,
    });
  }

  async updateStatus(
    id: string,
    status: EventOrderStatus,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).communityEventOrder.update({
      where: { id },
      data: { status },
    });
  }

  async markExpired(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });
  }
}
