import { Worker } from "bullmq";
import { prisma } from "config/prisma";
import { redis } from "config/redis.config";

enum PromotionJobType {
  VIEW = "VIEW",
  CLICK = "CLICK",
}

export const promotionWorker = new Worker(
  "promotion-analytics",
  async (job) => {
    const { promotionId, userId, ipAddress, userAgent } = job.data;

    switch (job.name) {
      case PromotionJobType.VIEW:
        await prisma.$transaction([
          prisma.promotion.update({
            where: { id: promotionId },
            data: { totalViews: { increment: 1 } },
          }),
          prisma.promotionImpression.create({
            data: {
              promotionId,
              userId,
              ipAddress,
              userAgent,
            },
          }),
        ]);
        break;

      case PromotionJobType.CLICK:
        await prisma.$transaction([
          prisma.promotion.update({
            where: { id: promotionId },
            data: { totalClicks: { increment: 1 } },
          }),
          prisma.promotionClick.create({
            data: {
              promotionId,
              userId,
            },
          }),
        ]);
        break;
    }
  },
  {
    connection: redis,
    concurrency: 20, // bisa kamu tuning
  },
);
