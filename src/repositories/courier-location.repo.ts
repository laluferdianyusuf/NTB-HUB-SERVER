import { prisma } from "config/prisma";

export class CourierLocationRepository {
  async updateLocation(courierId: string, latitude: number, longitude: number) {
    return prisma.courierLocation.upsert({
      where: { courierId },
      update: {
        latitude,
        longitude,
        updatedAt: new Date(),
      },
      create: {
        courierId,
        latitude,
        longitude,
      },
    });
  }

  async getLatest(courierId: string) {
    return prisma.courierLocation.findFirst({
      where: { courierId },
      orderBy: { updatedAt: "desc" },
    });
  }
}
