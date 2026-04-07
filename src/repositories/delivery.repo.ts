import { DeliveryStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class DeliveryRepository {
  async create(
    data: {
      courierId: string;
      userId?: string;
      bookingId?: string;
      pickupAddress: string;
      dropoffAddress: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.delivery.create({
      data: {
        ...data,
        status: "PENDING",
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.delivery.findUnique({
      where: { id },
      include: {
        courier: true,
        user: true,
        booking: true,
      },
    });
  }

  async findActiveByCourier(courierId: string) {
    return prisma.delivery.findFirst({
      where: {
        courierId,
        status: {
          in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"],
        },
      },
    });
  }

  async findPending() {
    return prisma.delivery.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
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
      where: { id: deliveryId },
      data: {
        courierId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });
  }

  private allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
    PENDING: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["PICKED_UP", "CANCELLED"],
    PICKED_UP: ["ON_THE_WAY"],
    ON_THE_WAY: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  async updateStatus(
    deliveryId: string,
    newStatus: DeliveryStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    const delivery = await client.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) throw new Error("Delivery not found");

    const allowed = this.allowedTransitions[delivery.status];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${delivery.status} → ${newStatus}`,
      );
    }

    const data: any = {
      status: newStatus,
    };

    // auto set timestamp
    if (newStatus === "PICKED_UP") data.pickedUpAt = new Date();
    if (newStatus === "DELIVERED") data.deliveredAt = new Date();

    return client.delivery.update({
      where: { id: deliveryId },
      data,
    });
  }

  async cancel(deliveryId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return this.updateStatus(deliveryId, "CANCELLED", tx);
  }

  async lockDelivery(deliveryId: string) {
    return prisma.$queryRaw`
      SELECT * FROM "Delivery"
      WHERE id = ${deliveryId}
      FOR UPDATE
    `;
  }
}
