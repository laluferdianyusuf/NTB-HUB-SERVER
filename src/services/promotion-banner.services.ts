import {
  Prisma,
  PromotionBannerType,
  PromotionEntityType,
} from "@prisma/client";
import { PromotionRedis } from "cache/promotion-banner.cache";
import { promotionQueue } from "queue/promotion.queue";
import { PromotionBannerRepository } from "repositories";

enum PromotionJobType {
  VIEW = "VIEW",
  CLICK = "CLICK",
}

type CreatePromotionDto = {
  title: string;
  description?: string;
  image: string;
  mobileImage?: string;
  type?: PromotionBannerType;
  entityType?: PromotionEntityType;
  entityId?: string;
  redirectUrl?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  priority?: number;
  startAt?: string | Date;
  endAt?: string | Date;
};

type UpdatePromotionDto = {
  title?: string;
  description?: string | null;
  image?: string;
  mobileImage?: string | null;
  type?: PromotionBannerType;
  entityType?: PromotionEntityType;
  entityId?: string | null;
  redirectUrl?: string | null;
  isActive?: boolean;
  isGlobal?: boolean;
  priority?: number;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
};

export class PromotionBannerService {
  private repo = new PromotionBannerRepository();
  private redis = new PromotionRedis();

  async getActiveBanners() {
    const cached = await this.redis.getCachedBanners();
    if (cached) return cached;

    const banners = await this.repo.findActiveBanners({
      isActive: true,
    });

    await this.redis.setCachedBanners(banners);

    return banners;
  }

  async recordView(
    promotionId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await promotionQueue.add(PromotionJobType.VIEW, {
      promotionId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async recordClick(promotionId: string, userId?: string) {
    await promotionQueue.add(PromotionJobType.CLICK, {
      promotionId,
      userId,
    });
  }

  async createPromotion(data: CreatePromotionDto, adminId: string) {
    const payload: Prisma.PromotionBannerCreateInput = {
      title: data.title,
      description: data.description,
      image: data.image,
      mobileImage: data.mobileImage,

      type: data.type,
      entityType: data.entityType,
      entityId: data.entityId,

      redirectUrl: data.redirectUrl,

      isActive: data.isActive ?? true,
      isGlobal: data.isGlobal ?? false,
      priority: data.priority ?? 0,

      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,

      createdBy: {
        connect: { id: adminId },
      },

      totalViews: 0,
      totalClicks: 0,
    };

    return this.repo.create(payload);
  }

  async updatePromotion(id: string, data: UpdatePromotionDto) {
    const payload: Prisma.PromotionBannerUpdateInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description ?? null,
      }),

      ...(data.image !== undefined && { image: data.image }),
      ...(data.mobileImage !== undefined && {
        mobileImage: data.mobileImage ?? null,
      }),

      ...(data.type !== undefined && { type: data.type }),
      ...(data.entityType !== undefined && { entityType: data.entityType }),

      ...(data.entityId !== undefined && {
        entityId: data.entityId ?? null,
      }),

      ...(data.redirectUrl !== undefined && {
        redirectUrl: data.redirectUrl ?? null,
      }),

      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isGlobal !== undefined && { isGlobal: data.isGlobal }),
      ...(data.priority !== undefined && { priority: data.priority }),

      ...(data.startAt !== undefined && {
        startAt: data.startAt ? new Date(data.startAt) : null,
      }),

      ...(data.endAt !== undefined && {
        endAt: data.endAt ? new Date(data.endAt) : null,
      }),
    };
    await this.redis.invalidateBannerCache();

    return this.repo.update(id, payload);
  }

  async deactivatePromotion(id: string) {
    const result = await this.repo.delete(id);

    await this.redis.invalidateBannerCache();

    return result;
  }

  async getAnalytics(id: string) {
    return this.repo.getAnalytics(id);
  }
}
