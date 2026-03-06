import { Prisma, TransactionStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export interface CreateOrderData {
  userId: string;
  venueId: string;
  bookingId?: string | null;
  total: Prisma.Decimal;
  status?: TransactionStatus;
}

export interface CreateOrderItemData {
  orderId: string;
  menuId: string;
  quantity: number;
  price: Prisma.Decimal;
  subtotal: Prisma.Decimal;
}

export interface UpdateOrderStatusData {
  orderId: string;
  status: TransactionStatus;
}

export class OrderRepository {
  async create(data: CreateOrderData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.order.create({
      data: {
        userId: data.userId,
        venueId: data.venueId,
        bookingId: data.bookingId,
        total: data.total,
        status: data.status ?? TransactionStatus.PENDING,
      },
    });
  }

  async findById(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
        venue: true,
      },
    });
  }

  async findByUser(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    orderId: string,
    status: TransactionStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async delete(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.order.delete({
      where: { id: orderId },
    });
  }
}
