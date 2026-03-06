import { Prisma } from "@prisma/client";
import { prisma } from "config/prisma";
import {
  InvoiceRepository,
  LedgerRepository,
  MenuRepository,
  OrderItemRepository,
  OrderRepository,
  PaymentRepository,
  UserBalanceRepository,
  VenueRepository,
} from "repositories";
import { AccountRepository } from "repositories/account.repo";

const orderRepository = new OrderRepository();
const orderItemRepository = new OrderItemRepository();
const menuRepository = new MenuRepository();
const userBalanceRepository = new UserBalanceRepository();
const invoiceRepository = new InvoiceRepository();
const venueRepository = new VenueRepository();
const ledgerRepository = new LedgerRepository();
const paymentRepository = new PaymentRepository();
const accountRepository = new AccountRepository();

export class OrderServices {
  async createNewOrder({
    venueId,
    userId,
    items,
  }: {
    venueId: string;
    userId: string;
    items: { menuId: string; quantity: number }[];
  }) {
    if (!items.length) throw new Error("Order items required");

    const venue = await venueRepository.findVenueById(venueId);
    if (!venue) throw new Error("No venue found");

    const invoiceNumber = `INV-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}`;

    const menuItems = [] as any;
    for (const item of items) {
      const menu = await menuRepository.findMenuById(item.menuId);
      if (!menu) {
        throw new Error("No menu found");
      }

      const subTotal = Number(menu.price) * item.quantity;

      menuItems.push({
        menuId: item.menuId,
        quantity: item.quantity,
        subtotal: subTotal,
      });
    }
    const result = await prisma.$transaction(async (tx) => {
      const menuIds = items.map((i) => i.menuId);
      const menus = await menuRepository.findMenuByIds(menuIds, tx);

      if (menus.length !== menuIds.length) {
        throw new Error("Some menu not found");
      }

      const menuMap = new Map(menus.map((m) => [m.id, m]));

      let total = 0;
      const orderItems = [];

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
      }

      const order = await orderRepository.create(
        {
          venueId,
          userId,
          bookingId: null,
          total: new Prisma.Decimal(total),
        },
        tx,
      );

      await orderItemRepository.createBulkOrders(
        orderItems.map((item) => ({
          ...item,
          orderId: order.id,
        })),
        tx,
      );

      const invoice = await invoiceRepository.create(
        {
          entityType: "ORDER",
          entityId: order.id,
          invoiceNumber,
          amount: total,
          expiredAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        tx,
      );

      return { order: invoice };
    });

    return {
      result,
    };
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

      if (!balance || balance < Number(order.total)) {
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
