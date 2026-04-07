import { PromotionSchedule } from "@prisma/client";
import { prisma } from "../config/prisma";

export class PromotionScheduleRepository {
  async findByPromotion(promotionId: string): Promise<PromotionSchedule[]> {
    return prisma.promotionSchedule.findMany({
      where: { promotionId },
    });
  }
}
