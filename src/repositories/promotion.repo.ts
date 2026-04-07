import { Prisma, Promotion } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  CreatePromotionInput,
  UpdatePromotionInput,
} from "../types/promotion.types";

export class PromotionRepository {
  async findById(id: string): Promise<Promotion | null> {
    return prisma.promotion.findUnique({
      where: { id },
      include: {
        items: true,
        schedules: true,
      },
    });
  }

  async findActiveByVenue(venueId: string, now: Date): Promise<Promotion[]> {
    return prisma.promotion.findMany({
      where: {
        venueId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        items: true,
        promotionSchedules: true,
      },
    });
  }

  async findByPromoCode(code: string): Promise<Promotion | null> {
    return prisma.promotion.findFirst({
      where: {
        promoCode: code,
        isActive: true,
      },
      include: {
        items: true,
        schedules: true,
      },
    });
  }

  async create(
    data: CreatePromotionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Promotion> {
    const db = tx ?? prisma;

    return db.promotion.create({
      data,
      include: {
        items: true,
        schedules: true,
      },
    });
  }

  async update(id: string, data: UpdatePromotionInput): Promise<Promotion> {
    return prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Promotion> {
    return prisma.promotion.delete({
      where: { id },
    });
  }

  async incrementUsage(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Promotion> {
    const db = tx ?? prisma;

    return db.promotion.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}
