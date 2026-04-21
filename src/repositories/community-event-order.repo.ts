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
        tickets: true,
        communityEvent: {
          select: {
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

  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventOrder.findFirst({
      where: { userId },
      include: {
        tickets: true,
        communityEvent: {
          select: {
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
    data: Prisma.CommunityEventOrderCreateInput,
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
