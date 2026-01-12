import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();
export class PublicPlaceImpressionRepository {
  async createImpression({
    placeId,
    userId,
  }: {
    placeId: string;
    userId?: string;
  }) {
    const since = dayjs().subtract(1, "hour").toDate();

    const existing = await prisma.publicPlaceImpression.findFirst({
      where: {
        placeId,
        OR: [userId ? { userId } : undefined].filter(Boolean) as any[],
        createdAt: { gte: since },
      },
    });

    if (existing) return;

    await prisma.publicPlaceImpression.create({
      data: {
        placeId,
        userId,
      },
    });
  }

  async countImpressionByPlaceId(placeId: string): Promise<number> {
    return prisma.publicPlaceImpression.count({
      where: { placeId },
    });
  }
}
