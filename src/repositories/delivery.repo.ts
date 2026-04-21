import { DeliveryStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class DeliveryRepository {
  async createDelivery(
    data: {
      userId?: string;
      bookingId?: string | null;
      pickupAddress: string;
      dropoffAddress: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    return client.delivery.create({
      data: {
        userId: data.userId ?? null,
        bookingId: data.bookingId ?? null,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        status: "PENDING",
      },
    });
  }

  async updateLastAssignedAt(id: string, tx: Prisma.TransactionClient) {
    return tx.delivery.update({
      where: { id },
      data: {
        lastAssignedAt: new Date(),
      },
    });
  }

  async lockDelivery(id: string, tx: Prisma.TransactionClient) {
    const result = await tx.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM "Delivery"
      WHERE id = $1
      FOR UPDATE
    `,
      id,
    );

    return result[0];
  }

  async findById(id: string, tx: Prisma.TransactionClient) {
    return tx.delivery.findUnique({
      where: { id },
    });
  }

  async assignCourier(
    deliveryId: string,
    courierId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.delivery.update({
      where: { id: deliveryId },
      data: {
        courierId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });
  }

  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    tx: Prisma.TransactionClient,
  ) {
    return tx.delivery.update({
      where: { id: deliveryId },
      data: { status },
    });
  }

  async incrementAttempt(deliveryId: string, tx: Prisma.TransactionClient) {
    return tx.delivery.update({
      where: { id: deliveryId },
      data: {
        attemptCount: {
          increment: 1,
        },
      },
    });
  }

  async resetToPending(deliveryId: string, tx: Prisma.TransactionClient) {
    return tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "PENDING",
        courierId: undefined,
      },
    });
  }

  async getRejectedCourierIds(
    deliveryId: string,
    tx: Prisma.TransactionClient,
  ) {
    const data = await tx.deliveryRejectedCourier.findMany({
      where: { deliveryId },
      select: { courierId: true },
    });

    return data.map((d) => d.courierId);
  }

  async addRejectedCourier(
    deliveryId: string,
    courierId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.deliveryRejectedCourier.upsert({
      where: {
        deliveryId_courierId: {
          deliveryId,
          courierId,
        },
      },
      update: {},
      create: {
        deliveryId,
        courierId,
      },
    });
  }

  async createAssignmentLog(
    data: {
      deliveryId: string;
      courierId: string;
      status: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    return tx.deliveryAssignmentLog.create({
      data,
    });
  }
}
