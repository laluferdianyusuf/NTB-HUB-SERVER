import { CourierStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class CourierRepository {
  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.courier.findUnique({
      where: { id },
      include: {
        locations: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.courier.findUnique({
      where: { userId },
    });
  }

  async updateStatus(
    courierId: string,
    status: CourierStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.courier.update({
      where: { id: courierId },
      data: { status },
    });
  }

  async setOnline(courierId: string, tx?: Prisma.TransactionClient) {
    return this.updateStatus(courierId, "ONLINE", tx);
  }

  async setOffline(courierId: string, tx?: Prisma.TransactionClient) {
    return this.updateStatus(courierId, "OFFLINE", tx);
  }

  async findAvailableCouriers(limit = 20) {
    return prisma.courier.findMany({
      where: {
        status: "ONLINE",
        isActive: true,
        deliveries: {
          none: {
            status: {
              in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"],
            },
          },
        },
      },
      include: {
        locations: true,
      },
      take: limit,
    });
  }

  async lockCourier(courierId: string) {
    // Raw query untuk SELECT FOR UPDATE
    return prisma.$queryRaw`
      SELECT * FROM "Courier"
      WHERE id = ${courierId}
      FOR UPDATE
    `;
  }

  async assignCourier(courierId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.courier.update({
      where: {
        id: courierId,
        status: "ONLINE",
      },
      data: {
        status: "ON_DELIVERY",
      },
    });
  }

  async incrementTripAndRating(
    courierId: string,
    newRating: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    const courier = await client.courier.findUnique({
      where: { id: courierId },
    });

    if (!courier) throw new Error("Courier not found");

    const totalTrips = courier.totalTrips + 1;

    const updatedRating =
      (courier.rating * courier.totalTrips + newRating) / totalTrips;

    return client.courier.update({
      where: { id: courierId },
      data: {
        totalTrips,
        rating: updatedRating,
      },
    });
  }

  async suspendCourier(courierId: string) {
    return prisma.courier.update({
      where: { id: courierId },
      data: {
        status: "SUSPENDED",
        isActive: false,
      },
    });
  }
}
