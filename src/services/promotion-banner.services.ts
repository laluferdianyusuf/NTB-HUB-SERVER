import { PromotionRedis } from "cache/promotion-banner.cache";
import { promotionQueue } from "queue/promotion.queue";
import { PromotionBannerRepository, PromotionRepository } from "repositories";

enum PromotionJobType {
  VIEW = "VIEW",
  CLICK = "CLICK",
}

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

  async createPromotion(data: any, adminId: string) {
    const promotion = await this.repo.create({
      ...data,
      createdBy: { connect: { id: adminId } },
    });

    await this.redis.invalidateBannerCache();

    return promotion;
  }

  async updatePromotion(id: string, data: any) {
    const promotion = await this.repo.update(id, data);

    await this.redis.invalidateBannerCache();

    return promotion;
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
