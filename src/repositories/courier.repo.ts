import { CourierStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class CourierRepository {
  async findById(id: string) {
    return prisma.courier.findUnique({
      where: { id },
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

  async findAvailableCouriers(limit = 20) {
    return prisma.courier.findMany({
      where: {
        status: "ONLINE",
        isActive: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
      take: limit,
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
