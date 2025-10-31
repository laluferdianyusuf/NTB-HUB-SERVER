import { PrismaClient, LocationTracking } from "@prisma/client";

const prisma = new PrismaClient();

export class LocationRepository {
  //   create new location tracking
  async createNewTracking(
    data: Omit<LocationTracking, "id" | "updatedAt">
  ): Promise<LocationTracking> {
    return await prisma.locationTracking.create({
      data: {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  // Find last location of a user (by userId)
  async findLocationTracking(userId: string): Promise<LocationTracking | null> {
    return prisma.locationTracking.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }
}
