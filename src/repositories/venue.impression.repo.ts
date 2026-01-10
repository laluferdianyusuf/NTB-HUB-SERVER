import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();
export class VenueImpressionRepository {
  async createImpression({
    venueId,
    userId,
    ipAddress,
    userAgent,
  }: {
    venueId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const since = dayjs().subtract(1, "hour").toDate();

    const existing = await prisma.venueImpression.findFirst({
      where: {
        venueId,
        OR: [
          userId ? { userId } : undefined,
          ipAddress ? { ipAddress } : undefined,
        ].filter(Boolean) as any[],
        createdAt: { gte: since },
      },
    });

    if (existing) return;

    await prisma.venueImpression.create({
      data: {
        venueId,
        userId,
        ipAddress,
        userAgent,
      },
    });
  }

  async countImpressionByVenueId(venueId: string): Promise<number> {
    return prisma.venueImpression.count({
      where: { venueId },
    });
  }
}
