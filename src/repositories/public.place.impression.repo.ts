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

    return await prisma.$transaction([
      prisma.publicPlaceImpression.create({
        data: {
          placeId,
          userId,
        },
      }),
      prisma.publicPlace.update({
        where: { id: placeId },
        data: {
          totalViews: { increment: 1 },
        },
      }),
    ]);
  }

  async countImpressionByPlaceId(placeId: string): Promise<number> {
    return prisma.publicPlaceImpression.count({
      where: { placeId },
    });
  }

  getVisitedPlaces(userId: string) {
    return prisma.publicPlaceImpression.findMany({
      where: { userId },
      select: {
        createdAt: true,
        place: {
          select: {
            id: true,
            name: true,
            type: true,
            image: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      distinct: ["placeId"],
    });
  }
}
