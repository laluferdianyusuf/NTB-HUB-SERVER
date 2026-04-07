export interface OrderItemInput {
  menuId: string;
  quantity: number;
  price: number;
}

export interface ApplyPromotionInput {
  venueId: string;
  userId: string;
  items: OrderItemInput[];
  orderTotal: number;
  promoCode?: string;
}

export interface PromotionCalculationResult {
  promotionId: string;
  discountAmount: number;
  freeItems: {
    menuId: string;
    quantity: number;
  }[];
  stackable: boolean;
  priority: number;
}
