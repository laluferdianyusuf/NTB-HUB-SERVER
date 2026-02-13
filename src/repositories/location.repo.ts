import { PrismaClient, LocationTracking } from "@prisma/client";

const prisma = new PrismaClient();

export class LocationRepository {
  async save(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<LocationTracking> {
    return await prisma.locationTracking.create({
      data: {
        userId,
        latitude,
        longitude,
      },
    });
  }

  async getLast(userId: string, limit = 10): Promise<LocationTracking[]> {
    return await prisma.locationTracking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getLatest(userId: string): Promise<LocationTracking | null> {
    return await prisma.locationTracking.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
