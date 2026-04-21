import { prisma } from "config/prisma";
import { redis } from "config/redis.config";

export class CourierTrackingService {
  async updateLocation(courierId: string, latitude: number, longitude: number) {
    const location = await prisma.courierLocation.upsert({
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

    const delivery = await prisma.delivery.findFirst({
      where: {
        courierId,
        status: {
          in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"],
        },
      },
    });

    if (delivery) {
      await redis.publish(
        `delivery:${delivery.id}`,
        JSON.stringify({
          courierId,
          latitude,
          longitude,
        }),
      );
    }

    return location;
  }
}
