import { EventOrderStatus } from "@prisma/client";
import { prisma } from "config/prisma";
import { generateTicketQR } from "helpers/qrCodeHelper";

import {
  AccountRepository,
  CommunityBalanceRepository,
  CommunityEventOrderRepository,
  CommunityEventTicketRepository,
  CommunityEventTicketTypeRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  PlatformBalanceRepository,
  UserBalanceRepository,
} from "repositories";

interface CreateOrderItem {
  ticketTypeId: string;
  quantity: number;
}

interface CreateCommunityEventOrderPayload {
  userId: string;
  communityEventId: string;
  items: CreateOrderItem[];
  paymentMethod: string;
  idempotencyKey: string;
}

export class CommunityEventOrderService {
  private ticketTypeRepo = new CommunityEventTicketTypeRepository();
  private orderRepo = new CommunityEventOrderRepository();
  private ticketRepo = new CommunityEventTicketRepository();
  private invoiceRepo = new InvoiceRepository();
  private paymentRepo = new PaymentRepository();
  private userBalanceRepo = new UserBalanceRepository();
  private ledgerRepo = new LedgerRepository();
  private accountRepo = new AccountRepository();
  private eventBalanceRepository = new CommunityBalanceRepository();
  private platformBalanceRepository = new PlatformBalanceRepository();

  private async generateTickets(
    order: any,
    items: { ticketTypeId: string; qty: number }[],
    tx: any,
  ) {
    const ticketTypes = await this.ticketTypeRepo.findActiveByEvent(
      order.communityEventId,
      tx,
    );

    const ticketsPayload: {
      userId: string;
      communityEventId: string;
      orderId: string;
      ticketTypeId: string;
      qrCode: string;
    }[] = [];

    for (const item of items) {
      const type = ticketTypes.find((t) => t.id === item.ticketTypeId);

      if (!type) {
        throw new Error("TICKET_TYPE_NOT_FOUND");
      }

      if (type.quota - type.sold < item.qty) {
        throw new Error("TICKET_SOLD_OUT");
      }

      for (let i = 0; i < item.qty; i++) {
        const ticketId = crypto.randomUUID();

        ticketsPayload.push({
          userId: order.userId,
          communityEventId: order.communityEventId,
          orderId: order.id,
          ticketTypeId: type.id,
          qrCode: generateTicketQR({
            ticketId,
            userId: order.userId,
            eventId: order.communityEventId,
          }),
        });
      }

      // update sold
      await this.ticketTypeRepo.incrementSold(type.id, item.qty, tx);
    }

    await this.ticketRepo.createMany(ticketsPayload, tx);
  }

  async createOrder(payload: CreateCommunityEventOrderPayload) {
    const { userId, communityEventId, items, paymentMethod, idempotencyKey } =
      payload;

    const existingOrder =
      await this.orderRepo.findByIdempotencyKey(idempotencyKey);

    if (existingOrder) return existingOrder;

    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      for (const item of items) {
        const ticketType = await this.ticketTypeRepo.findById(
          item.ticketTypeId,
          tx,
        );

        if (!ticketType) throw new Error("TICKET_NOT_FOUND");
        if (!ticketType.isActive) throw new Error("TICKET_INACTIVE");

        if (ticketType.sold + item.quantity > ticketType.quota) {
          throw new Error("TICKET_QUOTA_EXCEEDED");
        }

        totalAmount += Number(ticketType.price) * item.quantity;
      }

      const order = await this.orderRepo.create(
        {
          user: { connect: { id: userId } },
          communityEvent: { connect: { id: communityEventId } },
          total: totalAmount,
          status: EventOrderStatus.PENDING,
          idempotencyKey,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        tx,
      );

      await this.invoiceRepo.create(
        {
          entityType: "COMMUNITY_EVENT_ORDER",
          entityId: order.id,
          invoiceNumber: `COM-EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          amount: totalAmount,
          expiredAt: order.expiresAt!,
        },
        tx,
      );

      return order;
    });
  }

  async expireOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await this.orderRepo.findById(orderId, tx);

      if (!order || order.status !== "PENDING") return;

      const invoice = await this.invoiceRepo.findByEntity(
        "COMMUNITY_EVENT_ORDER",
        order.id,
        tx,
      );

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status !== "PENDING") {
        throw new Error("Invoice already paid or cancelled");
      }

      if (invoice.expiredAt && invoice.expiredAt < new Date()) {
        throw new Error("INVOICE_EXPIRED");
      }

      await this.orderRepo.updateStatus(orderId, "CANCELLED", tx);

      await this.invoiceRepo.markExpired(invoice.id, tx);

      await this.ticketRepo.expireTicketsByOrder(orderId, tx);

      // rollback quota
      for (const ticket of order.tickets) {
        await this.ticketTypeRepo.decrementSold(ticket.ticketTypeId, 1, tx);
      }
    });
  }

  async handlePaymentSuccess(
    orderId: string,
    items: { ticketTypeId: string; qty: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await this.orderRepo.findById(orderId, tx);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status === "PAID") return order;

      if (order.status !== "PENDING") {
        throw new Error("INVALID_ORDER_STATUS");
      }

      const invoice = await this.invoiceRepo.findByEntity(
        "COMMUNITY_EVENT_ORDER",
        order.id,
        tx,
      );

      const userAccount = await this.accountRepo.findUserAccount(order.userId);
      const eventAccount = await this.accountRepo.findCommunityAccount(
        order.communityEvent.community.id,
      );
      const platformAccount = await this.accountRepo.findPlatformAccount();

      if (!userAccount || !eventAccount || !platformAccount) {
        throw new Error("Account not found");
      }

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status !== "PENDING") {
        throw new Error("Invoice already paid or cancelled");
      }

      if (invoice.expiredAt && invoice.expiredAt < new Date()) {
        throw new Error("INVOICE_EXPIRED");
      }

      const balance = await this.ledgerRepo.getBalance(order.userId);
      const platformFee = Number(invoice.amount) * 0.1;
      const eventAmount = Number(invoice.amount) - platformFee;

      if (!balance || balance.totalBalance < Number(order.total)) {
        throw new Error("Insufficient balance");
      }

      if (!balance || balance.balance < Number(order.total)) {
        throw new Error("Insufficient balance");
      }

      const paymentId = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await this.ledgerRepo.createMany(
        [
          {
            accountId: userAccount?.id as string,
            type: "DEBIT",
            amount: Number(invoice.amount),
            referenceType: "COMMUNITY_EVENT_PAYMENT",
            referenceId: order.id,
          },
          {
            accountId: eventAccount.id,
            type: "CREDIT",
            amount: eventAmount,
            referenceType: "COMMUNITY_EVENT_PAYMENT",
            referenceId: order.id,
          },
          {
            accountId: platformAccount.id,
            type: "CREDIT",
            amount: platformFee,
            referenceType: "FEE",
            referenceId: order.id,
          },
        ],
        tx,
      );

      await this.userBalanceRepo.decrementBalance(
        order.userId,
        Number(invoice.amount),
        tx,
      );

      await this.eventBalanceRepository.incrementBalance(
        order.communityEvent.community.id,
        Number(eventAmount),
        tx,
      );

      await this.platformBalanceRepository.incrementBalance(
        Number(platformFee),
        tx,
      );

      await this.paymentRepo.create(
        {
          invoiceId: invoice.id,
          amount: Number(invoice.amount),
          method: "WALLET",
          provider: "NTB_HUB",
          providerRef: paymentId,
        },
        tx,
      );

      await this.invoiceRepo.markPaid(invoice.id, tx);
      await this.orderRepo.updateStatus(order.id, "PAID", tx);

      await this.generateTickets(order, items, tx);

      return order;
    });
  }

  async getEventOrders(userId: string) {
    const orders = await this.orderRepo.findByUserId(userId);

    if (!orders) {
      throw new Error("Ticket not found");
    }

    return orders;
  }

  async getOrderDetail(orderId: string) {
    return this.orderRepo.findById(orderId);
  }
}
