import { Prisma, PromotionUsage } from "@prisma/client";
import { prisma } from "../config/prisma";

export interface CreatePromotionUsageInput {
  promotionId: string;
  userId: string;
  orderId?: string;
}

export class PromotionUsageRepository {
  async create(
    data: CreatePromotionUsageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PromotionUsage> {
    const db = tx ?? prisma;

    return db.promotionUsage.create({
      data,
    });
  }

  async countUserUsage(promotionId: string, userId: string): Promise<number> {
    return prisma.promotionUsage.count({
      where: {
        promotionId,
        userId,
      },
    });
  }

  async findByOrder(orderId: string) {
    return prisma.promotionUsage.findMany({
      where: { orderId },
      include: {
        promotion: true,
      },
    });
  }
}
