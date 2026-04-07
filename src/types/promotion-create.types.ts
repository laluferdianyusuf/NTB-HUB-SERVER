import { DiscountType, PromotionType } from "@prisma/client";

export interface CreatePromotionItemInput {
  menuId?: string;
  quantity?: number;
  isReward?: boolean;
}

export interface CreatePromotionScheduleInput {
  dayOfWeek?: number;
  startHour?: number;
  endHour?: number;
}

export interface CreatePromotionInput {
  venueId?: string;

  title: string;
  description?: string;

  type: PromotionType;

  discountType?: DiscountType;
  discountValue?: number;

  minOrderAmount?: number;

  startAt: Date;
  endAt: Date;

  maxUsage?: number;
  perUserLimit?: number;

  promoCode?: string;
  stackable?: boolean;

  items?: CreatePromotionItemInput[];
  schedules?: CreatePromotionScheduleInput[];
}
