import { Promotion } from "@prisma/client";
import { redis } from "config/redis.config";

export class PromotionRedis {
  private BANNER_KEY = "promotion:active:banners";
  private VIEW_KEY = (id: string) => `promotion:view:${id}`;
  private CLICK_KEY = (id: string) => `promotion:click:${id}`;

  async getCachedBanners(): Promise<Promotion[] | null> {
    const data = await redis.get(this.BANNER_KEY);
    return data ? JSON.parse(data) : null;
  }

  async setCachedBanners(data: any, ttl = 120) {
    await redis.set(this.BANNER_KEY, JSON.stringify(data), "EX", ttl);
  }

  async invalidateBannerCache() {
    await redis.del(this.BANNER_KEY);
  }

  async incrementView(id: string) {
    await redis.incr(this.VIEW_KEY(id));
  }

  async getViewCount(id: string): Promise<number> {
    const val = await redis.get(this.VIEW_KEY(id));
    return Number(val || 0);
  }

  async resetViewCount(id: string) {
    await redis.del(this.VIEW_KEY(id));
  }

  async incrementClick(id: string) {
    await redis.incr(this.CLICK_KEY(id));
  }

  async getClickCount(id: string): Promise<number> {
    const val = await redis.get(this.CLICK_KEY(id));
    return Number(val || 0);
  }

  async resetClickCount(id: string) {
    await redis.del(this.CLICK_KEY(id));
  }
}
