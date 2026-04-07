import {
  DiscountType,
  Prisma,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

export interface CreatePromotionInput {
  venueId?: string;

  title: string;
  description?: string;

  type: PromotionType;

  discountType?: DiscountType;
  discountValue?: Prisma.Decimal;

  minOrderAmount?: Prisma.Decimal;

  startAt: Date;
  endAt: Date;

  maxUsage?: number;
  perUserLimit?: number;

  promoCode?: string;

  isActive?: boolean;
  status?: PromotionStatus;
}

export interface UpdatePromotionInput extends Partial<CreatePromotionInput> {
  approvedBy?: string;
  approvedAt?: Date;
}
