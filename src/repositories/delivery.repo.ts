import { DeliveryStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class DeliveryRepository {
  async create(data: Prisma.DeliveryCreateInput) {
    return prisma.delivery.create({ data });
  }

  async findById(id: string) {
    return prisma.delivery.findUnique({
      where: { id },
      include: {
        courier: true,
        booking: true,
      },
    });
  }

  async assignCourier(
    deliveryId: string,
    courierId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.delivery.update({
      where: {
        id: deliveryId,
        status: "PENDING",
      },
      data: {
        courierId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });
  }

  async updateStatus(
    deliveryId: string,
    currentStatus: DeliveryStatus,
    nextStatus: DeliveryStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.delivery.updateMany({
      where: {
        id: deliveryId,
        status: currentStatus,
      },
      data: {
        status: nextStatus,
        ...(nextStatus === "PICKED_UP" && {
          pickedUpAt: new Date(),
        }),
        ...(nextStatus === "DELIVERED" && {
          deliveredAt: new Date(),
        }),
      },
    });
  }

  async findActiveDeliveryByCourier(courierId: string) {
    return prisma.delivery.findFirst({
      where: {
        courierId,
        status: {
          in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"],
        },
      },
    });
  }

  async findPending(limit = 20) {
    return prisma.delivery.findMany({
      where: { status: "PENDING" },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
  }
}
