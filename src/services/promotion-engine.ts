import { Promotion, PromotionItem, PromotionType } from "@prisma/client";

import {
  OrderItemInput,
  PromotionCalculationResult,
} from "../types/promotion-engine.types";

export type PromotionWithItems = Promotion & {
  items: PromotionItem[];
};

export class PromotionEngine {
  evaluatePromotions(
    promotions: PromotionWithItems[],
    items: OrderItemInput[],
    orderTotal: number,
  ): PromotionCalculationResult[] {
    const results: PromotionCalculationResult[] = [];

    for (const promo of promotions) {
      const result = this.calculatePromotion(promo, items, orderTotal);

      if (result) {
        results.push(result);
      }
    }

    return this.resolveBestPromotions(results);
  }

  private calculatePromotion(
    promo: PromotionWithItems,
    items: OrderItemInput[],
    orderTotal: number,
  ): PromotionCalculationResult | null {
    switch (promo.type) {
      case PromotionType.ORDER_DISCOUNT:
        return this.orderDiscount(promo, orderTotal);

      case PromotionType.MENU_DISCOUNT:
        return this.menuDiscount(promo, items);

      case PromotionType.BUY_X_GET_Y:
        return this.buyXGetY(promo, items);

      case PromotionType.BUNDLE:
        return this.bundle(promo, items);

      default:
        return null;
    }
  }

  private orderDiscount(
    promo: PromotionWithItems,
    orderTotal: number,
  ): PromotionCalculationResult | null {
    if (!promo.discountValue) return null;

    const percent = promo.discountValue.toNumber();

    const discount = orderTotal * (percent / 100);

    return {
      promotionId: promo.id,
      discountAmount: discount,
      freeItems: [],
      stackable: promo.stackable ?? false,
      priority: promo.priority ?? 0,
    };
  }

  private menuDiscount(
    promo: PromotionWithItems,
    items: OrderItemInput[],
  ): PromotionCalculationResult | null {
    if (!promo.discountValue) return null;

    const targetMenus = new Set(promo.items.map((i) => i.menuId));

    let discount = 0;

    for (const item of items) {
      if (!targetMenus.has(item.menuId)) continue;

      discount +=
        item.price * item.quantity * (promo.discountValue.toNumber() / 100);
    }

    if (!discount) return null;

    return {
      promotionId: promo.id,
      discountAmount: discount,
      freeItems: [],
      stackable: promo.stackable ?? false,
      priority: promo.priority ?? 0,
    };
  }

  private buyXGetY(
    promo: PromotionWithItems,
    items: OrderItemInput[],
  ): PromotionCalculationResult | null {
    const buyItems = promo.items.filter((i) => !i.isReward);
    const rewardItems = promo.items.filter((i) => i.isReward);

    let multiplier = Infinity;

    for (const buy of buyItems) {
      const orderItem = items.find((i) => i.menuId === buy.menuId);

      const requiredQty = buy.quantity ?? 0;

      if (!orderItem) return null;

      multiplier = Math.min(
        multiplier,
        Math.floor(orderItem.quantity / requiredQty),
      );
    }

    if (multiplier <= 0) return null;

    const freeItems = rewardItems.map((r) => ({
      menuId: r.menuId as string,
      quantity: (r.quantity as number) * multiplier,
    }));

    return {
      promotionId: promo.id,
      discountAmount: 0,
      freeItems,
      stackable: promo.stackable ?? false,
      priority: promo.priority ?? 0,
    };
  }

  private bundle(
    promo: PromotionWithItems,
    items: OrderItemInput[],
  ): PromotionCalculationResult | null {
    let multiplier = Infinity;

    for (const bundleItem of promo.items) {
      const orderItem = items.find((i) => i.menuId === bundleItem.menuId);

      if (!orderItem) return null;

      const requiredQty = bundleItem.quantity ?? 1;

      multiplier = Math.min(
        multiplier,
        Math.floor(orderItem.quantity / requiredQty),
      );
    }

    if (multiplier <= 0) return null;

    const discount = (promo.discountValue?.toNumber() ?? 0) * multiplier;

    return {
      promotionId: promo.id,
      discountAmount: discount,
      freeItems: [],
      stackable: promo.stackable ?? false,
      priority: promo.priority ?? 0,
    };
  }

  private resolveBestPromotions(
    results: PromotionCalculationResult[],
  ): PromotionCalculationResult[] {
    if (!results.length) return [];

    results.sort(
      (a, b) => b.discountAmount - a.discountAmount || b.priority - a.priority,
    );

    const best = results[0];

    if (!best.stackable) {
      return [best];
    }

    const stackables = results.filter(
      (p) => p.stackable && p.promotionId !== best.promotionId,
    );

    return [best, ...stackables];
  }
}
