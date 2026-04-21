import { Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

import { dispatchAssignDelivery } from "queue/dispatch";
import {
  DeliveryRepository,
  InvoiceRepository,
  LedgerRepository,
  MenuRepository,
  OrderItemRepository,
  OrderRepository,
  PaymentRepository,
  UserBalanceRepository,
  UserRepository,
  VenueRepository,
} from "repositories";
import { AccountRepository } from "repositories/account.repo";
import { PromotionService } from "./promotion.services";

const orderRepository = new OrderRepository();
const orderItemRepository = new OrderItemRepository();
const menuRepository = new MenuRepository();
const userBalanceRepository = new UserBalanceRepository();
const invoiceRepository = new InvoiceRepository();
const venueRepository = new VenueRepository();
const ledgerRepository = new LedgerRepository();
const paymentRepository = new PaymentRepository();
const accountRepository = new AccountRepository();
const promotionService = new PromotionService();
const deliveryRepository = new DeliveryRepository();
const userRepository = new UserRepository();

export class OrderServices {
  async createNewOrder({
    venueId,
    userId,
    items,
    promoCode,
  }: {
    venueId: string;
    userId: string;
    promoCode?: string;
    items: { menuId: string; quantity: number }[];
  }) {
    if (!items.length) throw new Error("Order items required");

    const venue = await venueRepository.findVenueById(venueId);
    if (!venue) throw new Error("No venue found");

    const invoiceNumber = `INV-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}`;

    return prisma.$transaction(async (tx) => {
      const menuIds = items.map((i) => i.menuId);
      const menus = await menuRepository.findMenuByIds(menuIds, tx);

      if (menus.length !== menuIds.length) {
        throw new Error("Some menu not found");
      }

      const menuMap = new Map(menus.map((m) => [m.id, m]));

      let total = 0;

      const orderItems: any[] = [];
      const promoItems: any[] = [];

      for (const item of items) {
        const menu = menuMap.get(item.menuId);
        if (!menu) throw new Error("Invalid menu");

        const subtotal = Number(menu.price) * item.quantity;
        total += subtotal;

        orderItems.push({
          menuId: menu.id,
          quantity: item.quantity,
          price: menu.price,
          subtotal,
        });

        promoItems.push({
          menuId: menu.id,
          price: Number(menu.price),
          quantity: item.quantity,
        });
      }

      const promotions = await promotionService.applyPromotions({
        venueId,
        userId,
        promoCode,
        orderTotal: total,
        items: promoItems,
      });

      let discount = 0;
      const freeItems: any[] = [];

      for (const promo of promotions) {
        discount += promo.discountAmount;
        freeItems.push(...promo.freeItems);
      }

      const finalTotal = total - discount;

      const order = await orderRepository.create(
        {
          venueId,
          userId,
          bookingId: null,
          total: new Prisma.Decimal(finalTotal),
          discount: new Prisma.Decimal(discount),
        },
        tx,
      );

      for (const free of freeItems) {
        orderItems.push({
          menuId: free.menuId,
          quantity: free.quantity,
          price: 0,
          subtotal: 0,
        });
      }

      await orderItemRepository.createBulkOrders(
        orderItems.map((item) => ({
          ...item,
          orderId: order.id,
        })),
        tx,
      );

      for (const promo of promotions) {
        await promotionService.recordPromotionUsage(
          promo.promotionId,
          userId,
          order.id,
        );
      }

      const invoice = await invoiceRepository.create(
        {
          entityType: "ORDER",
          entityId: order.id,
          invoiceNumber,
          amount: finalTotal,
          expiredAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        tx,
      );

      return {
        order,
        invoice,
        discount,
        promotions,
      };
    });
  }

  async cancelOrder(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await orderRepository.findById(orderId, tx);

      if (!order) throw new Error("Order not found");
      if (order.userId !== userId) throw new Error("Unauthorized");

      if (order.status !== "PENDING") {
        throw new Error("Order cannot be cancelled");
      }

      await orderRepository.updateStatus(orderId, "CANCELLED", tx);

      await invoiceRepository.cancelByEntity("ORDER", orderId, tx);

      return order;
    });
  }

  async payOrder(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await orderRepository.findById(orderId, tx);

      if (!order || order.userId !== userId) {
        throw new Error("Order not found");
      }

      if (order.status !== "PENDING") {
        throw new Error("Invalid order status");
      }
      const venue = await venueRepository.findVenueById(order.venueId);
      const user = await userRepository.findById(order.userId);

      const userAccount = await accountRepository.findUserAccount(order.userId);
      const venueAccount = await accountRepository.findVenueAccount(
        order.venueId,
      );

      if (!userAccount || !venueAccount) {
        throw new Error("Account not found");
      }

      const invoice = await invoiceRepository.findByEntity(
        "ORDER",
        order.id,
        tx,
      );

      if (!invoice) throw new Error("Invoice not found");

      if (invoice.status !== "PENDING") {
        throw new Error("Invoice already paid or cancelled");
      }

      const balance = await ledgerRepository.getBalance(userId);

      if (!balance || balance.totalBalance < Number(order.total)) {
        throw new Error("Insufficient balance");
      }

      const paymentId = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await userBalanceRepository.decrementBalance(
        userId,
        Number(order.total),
        tx,
      );

      const payment = await paymentRepository.create({
        invoiceId: invoice.id,
        amount: Number(invoice.amount),
        method: "WALLET",
        provider: "NTB_HUB",
        providerRef: paymentId,
      });

      await ledgerRepository.createMany(
        [
          {
            accountId: userAccount.id as string,
            type: "DEBIT",
            amount: Number(order.total),
            referenceType: "ORDER",
            referenceId: order.id,
          },
          {
            accountId: venueAccount.id as string,
            type: "CREDIT",
            amount: Number(order.total),
            referenceType: "ORDER",
            referenceId: order.id,
          },
        ],
        tx,
      );

      await invoiceRepository.markPaid(invoice.id, tx);

      await orderRepository.updateStatus(orderId, "SUCCESS", tx);

      const delivery = await deliveryRepository.createDelivery({
        userId: order.userId,
        bookingId: order.bookingId ?? null,
        pickupAddress: venue?.address as string,
        dropoffAddress: user?.address as string,
      });

      setImmediate(() => {
        dispatchAssignDelivery(delivery.id);
      });

      return payment;
    });
  }

  async getAllByUser(userId: string) {
    const orders = await orderRepository.findByUser(userId);

    if (!orders) {
      throw new Error("Orders not found");
    }

    return orders;
  }
}
