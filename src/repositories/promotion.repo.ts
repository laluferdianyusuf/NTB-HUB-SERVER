import { Prisma, PromotionEntityType, PromotionType } from "@prisma/client";
import { prisma } from "config/prisma";

export interface PromotionFilter {
  isActive?: boolean;
  type?: PromotionType;
  entityType?: PromotionEntityType;
  entityId?: string;
  now?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class PromotionRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: Prisma.PromotionCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.promotion.create({ data });
  }

  async update(
    id: string,
    data: Prisma.PromotionUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.promotion.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.promotion.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findActiveBanners(
    filter?: PromotionFilter,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    const now = filter?.now ?? new Date();

    return client.promotion.findMany({
      where: {
        isActive: true,
        ...(filter?.type && { type: filter.type }),
        ...(filter?.entityType && { entityType: filter.entityType }),
        ...(filter?.entityId && { entityId: filter.entityId }),

        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
      orderBy: {
        priority: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        mobileImage: true,
        type: true,
        entityType: true,
        entityId: true,
        redirectUrl: true,
        priority: true,
      },
    });
  }

  async findAll(
    filter: PromotionFilter,
    pagination: PaginationOptions,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PromotionWhereInput = {
      ...(filter.isActive !== undefined && { isActive: filter.isActive }),
      ...(filter.type && { type: filter.type }),
      ...(filter.entityType && { entityType: filter.entityType }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.promotion.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async incrementView(
    promotionId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return prisma.$transaction([
      prisma.promotionImpression.create({
        data: {
          promotionId,
          userId,
          ipAddress,
          userAgent,
        },
      }),
      prisma.promotion.update({
        where: { id: promotionId },
        data: {
          totalViews: { increment: 1 },
        },
      }),
    ]);
  }

  async incrementClick(
    promotionId: string,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return prisma.$transaction([
      prisma.promotionClick.create({
        data: {
          promotionId,
          userId,
        },
      }),
      prisma.promotion.update({
        where: { id: promotionId },
        data: {
          totalClicks: { increment: 1 },
        },
      }),
    ]);
  }

  async getAnalytics(promotionId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const [promotion, views, clicks] = await prisma.$transaction([
      prisma.promotion.findUnique({
        where: { id: promotionId },
        select: {
          id: true,
          title: true,
          totalViews: true,
          totalClicks: true,
        },
      }),
      prisma.promotionImpression.count({
        where: { promotionId },
      }),
      prisma.promotionClick.count({
        where: { promotionId },
      }),
    ]);

    return {
      promotion,
      views,
      clicks,
      ctr: views === 0 ? 0 : Number(((clicks / views) * 100).toFixed(2)),
    };
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.promotion.delete({
      where: { id },
    });
  }
}
