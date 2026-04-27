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
      },
    });
  }

  async create(
    data: CreatePromotionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Promotion> {
    const db = tx ?? prisma;

    return db.promotion.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        startAt: data.startAt,
        endAt: data.endAt,
        maxUsage: data.maxUsage,
        perUserLimit: data.perUserLimit,
        promoCode: data.promoCode,
        isActive: data.isActive,
        status: data.status,

        venue: {
          connect: {
            id: data.venueId,
          },
        },
      },
      include: {
        items: true,
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

  count(where: any) {
    return prisma.promotion.count({
      where,
    });
  }

  async findByVenue({
    venueId,
    search,
    status,
    page = 1,
    limit = 20,
  }: {
    venueId: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.PromotionWhereInput = {
      venueId,
    };

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          promoCode: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status as any;
    }

    const [data, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      }),

      prisma.promotion.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
