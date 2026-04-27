import { Promotion, PromotionItem } from "@prisma/client";
import { prisma } from "../config/prisma";

import {
  ApplyPromotionInput,
  PromotionCalculationResult,
} from "../types/promotion-engine.types";

import { Decimal } from "@prisma/client/runtime/library";
import { PromotionCache } from "cache/promotion.cache";
import {
  PromotionItemRepository,
  PromotionRepository,
  PromotionScheduleRepository,
  PromotionUsageRepository,
} from "repositories";
import { CreatePromotionInput } from "../types/promotion-create.types";
import { PromotionEngine } from "./promotion-engine";

export type PromotionWithItems = Promotion & {
  items: PromotionItem[];
};

export class PromotionService {
  private promotionRepo = new PromotionRepository();
  private itemRepo = new PromotionItemRepository();
  private scheduleRepo = new PromotionScheduleRepository();
  private usageRepo = new PromotionUsageRepository();
  private engine = new PromotionEngine();

  async createPromotion(data: CreatePromotionInput) {
    const promotion = await prisma.$transaction(async (tx) => {
      const promo = await this.promotionRepo.create(
        {
          venueId: data.venueId,
          title: data.title,
          description: data.description,
          type: data.type,
          discountType: data.discountType,
          discountValue: new Decimal(data.discountValue as number),
          minOrderAmount: new Decimal(data.minOrderAmount as number),
          startAt: data.startAt,
          endAt: data.endAt,
          maxUsage: data.maxUsage,
          perUserLimit: data.perUserLimit,
          promoCode: data.promoCode,
          isActive: false,
          status: "PENDING",
        },
        tx,
      );

      if (data.items?.length) {
        await this.itemRepo.createMany(
          data.items.map((item) => ({
            promotionId: promo.id,
            menuId: item.menuId,
            quantity: item.quantity,
            isReward: item.isReward ?? false,
          })),
          tx,
        );
      }

      if (data.schedules?.length) {
        await tx.promotionSchedule.createMany({
          data: data.schedules.map((s) => ({
            promotionId: promo.id,
            dayOfWeek: s.dayOfWeek,
            startHour: s.startHour,
            endHour: s.endHour,
          })),
        });
      }

      return promo;
    });

    await PromotionCache.invalidateVenuePromos(data.venueId as string);

    return promotion;
  }

  async approvePromotion(promotionId: string, adminId: string) {
    const promo = await this.promotionRepo.findById(promotionId);

    if (!promo) {
      throw new Error("Promotion not found");
    }

    if (promo.status !== "PENDING") {
      throw new Error("Promotion already processed");
    }

    const updated = await this.promotionRepo.update(promotionId, {
      status: "APPROVED",
      isActive: true,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    await PromotionCache.invalidateVenuePromos(updated.venueId as string);

    return updated;
  }

  async rejectPromotion(promotionId: string) {
    const promo = await this.promotionRepo.findById(promotionId);

    if (!promo) {
      throw new Error("Promotion not found");
    }

    const updated = await this.promotionRepo.update(promotionId, {
      status: "REJECTED",
      isActive: false,
    });

    await PromotionCache.invalidateVenuePromos(updated.venueId as string);

    return updated;
  }

  async getSummary(venueId: string) {
    const [total, pending, approved, rejected, active] = await Promise.all([
      this.promotionRepo.count({
        venueId,
      }),

      this.promotionRepo.count({
        venueId,
        status: "PENDING",
      }),

      this.promotionRepo.count({
        venueId,
        status: "APPROVED",
      }),

      this.promotionRepo.count({
        venueId,
        status: "REJECTED",
      }),

      this.promotionRepo.count({
        venueId,
        isActive: true,
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      active,
    };
  }

  async getByVenue(params: {
    venueId: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    return this.promotionRepo.findByVenue(params);
  }

  async applyPromotions(
    input: ApplyPromotionInput,
  ): Promise<PromotionCalculationResult[]> {
    const promotions = input.promoCode
      ? await this.getPromoByCode(input.promoCode)
      : await this.getVenuePromotions(input.venueId);

    if (!promotions.length) return [];

    const validPromos: Promotion[] = [];

    for (const promo of promotions) {
      const valid = await this.validatePromotion(promo, input);
      if (valid) validPromos.push(promo);
    }

    if (!validPromos.length) return [];

    const promoIds = validPromos.map((p) => p.id);

    const itemMap = await this.getPromotionItemsBatch(promoIds);

    const promosWithItems: PromotionWithItems[] = validPromos.map((p) => ({
      ...p,
      items: itemMap.get(p.id) ?? [],
    }));

    const results = this.engine.evaluatePromotions(
      promosWithItems,
      input.items,
      input.orderTotal,
    );

    return results;
  }

  private async getPromotionItemsBatch(promoIds: string[]) {
    const items = await this.itemRepo.findByPromotion({
      promotionId: {
        in: promoIds,
      },
    });

    const map = new Map<string, PromotionItem[]>();

    for (const item of items) {
      if (!map.has(item.promotionId)) {
        map.set(item.promotionId, []);
      }

      map.get(item.promotionId)!.push(item);
    }

    return map;
  }

  private async validatePromotion(
    promo: Promotion,
    input: ApplyPromotionInput,
  ) {
    if (promo.status !== "APPROVED") return false;

    if (!promo.isActive) return false;

    const now = new Date();

    if (promo.startAt > now) return false;
    if (promo.endAt < now) return false;

    if (
      promo.minOrderAmount &&
      input.orderTotal < Number(promo.minOrderAmount)
    ) {
      return false;
    }

    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      return false;
    }

    const scheduleValid = await this.validateSchedule(promo.id);
    if (!scheduleValid) return false;

    if (promo.perUserLimit) {
      let usage = await PromotionCache.getUserUsage(promo.id, input.userId);

      if (usage === null) {
        usage = await this.usageRepo.countUserUsage(promo.id, input.userId);

        await PromotionCache.setUserUsage(promo.id, input.userId, usage);
      }

      if (usage >= promo.perUserLimit) return false;
    }

    return true;
  }

  private async validateSchedule(promoId: string) {
    const schedules = await this.scheduleRepo.findByPromotion(promoId);

    if (!schedules?.length) return true;

    const now = new Date();

    const day = now.getDay();
    const hour = now.getHours();

    return schedules.some((s) => {
      if (s.startHour === null || s.endHour === null) {
        return false;
      }

      return s.dayOfWeek === day && hour >= s.startHour && hour <= s.endHour;
    });
  }

  async recordPromotionUsage(
    promotionId: string,
    userId: string,
    orderId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.promotionUsage.create({
        data: {
          promotionId,
          userId,
          orderId,
        },
      });

      await tx.promotion.update({
        where: { id: promotionId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    });

    await PromotionCache.invalidateUserUsage(promotionId, userId);
  }

  private async getPromoByCode(code: string) {
    const cached = await PromotionCache.getPromoCode(code);

    if (cached) return [cached];

    const promo = await this.promotionRepo.findByPromoCode(code);

    if (!promo) return [];

    await PromotionCache.setPromoCode(code, promo);

    return [promo];
  }

  private async getVenuePromotions(venueId: string) {
    const cached = await PromotionCache.getVenuePromos(venueId);

    if (cached) return cached;

    const promos = await this.promotionRepo.findActiveByVenue(
      venueId,
      new Date(),
    );

    await PromotionCache.setVenuePromos(venueId, promos);

    return promos;
  }
}
