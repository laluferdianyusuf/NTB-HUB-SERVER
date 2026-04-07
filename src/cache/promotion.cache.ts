import { Promotion } from "@prisma/client";
import { redis } from "config/redis.config";

export class PromotionCache {
  static venuePromosKey(venueId: string) {
    return `promo:venue:${venueId}`;
  }

  static promoCodeKey(code: string) {
    return `promo:code:${code}`;
  }

  static userUsageKey(promoId: string, userId: string) {
    return `promo:usage:${promoId}:${userId}`;
  }

  static async getPromoCode(code: string): Promise<Promotion | null> {
    const data = await redis.get(this.promoCodeKey(code));

    if (!data) return null;

    try {
      return JSON.parse(data) as Promotion;
    } catch {
      return null;
    }
  }

  static async setPromoCode(code: string, promo: Promotion) {
    await redis.set(this.promoCodeKey(code), JSON.stringify(promo), "EX", 600);
  }

  static async getVenuePromos(venueId: string): Promise<Promotion[] | null> {
    const data = await redis.get(this.venuePromosKey(venueId));

    if (!data) return null;

    try {
      return JSON.parse(data) as Promotion[];
    } catch {
      return null;
    }
  }

  static async setVenuePromos(venueId: string, promos: Promotion[]) {
    await redis.set(
      this.venuePromosKey(venueId),
      JSON.stringify(promos),
      "EX",
      300,
    );
  }

  static async invalidateVenuePromos(venueId: string) {
    await redis.del(this.venuePromosKey(venueId));
  }

  static async getUserUsage(
    promoId: string,
    userId: string,
  ): Promise<number | null> {
    const data = await redis.get(this.userUsageKey(promoId, userId));

    return data ? Number(data) : null;
  }

  static async setUserUsage(promoId: string, userId: string, count: number) {
    await redis.set(
      this.userUsageKey(promoId, userId),
      count.toString(),
      "EX",
      600,
    );
  }

  static async invalidateUserUsage(promoId: string, userId: string) {
    await redis.del(this.userUsageKey(promoId, userId));
  }
}
