import { CommunityEventOrder, EventOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";
import { generateTicketQR } from "helpers/qrCodeHelper";

import {
  AccountRepository,
  CommunityBalanceRepository,
  CommunityEventAttendanceRepository,
  CommunityEventOrderRepository,
  CommunityEventTicketRepository,
  CommunityEventTicketTypeRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  PlatformBalanceRepository,
  UserBalanceRepository,
  UserRepository,
} from "repositories";
import { UserService } from "./user.services";
import jwt from "jsonwebtoken";

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
  private userRepository = new UserRepository();
  private userService = new UserService();
  private attendanceRepo = new CommunityEventAttendanceRepository();

  private async generateTickets(
    order: CommunityEventOrder,
    items: { ticketTypeId: string; qty: number }[],
    tx: Prisma.TransactionClient,
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
        ticketsPayload.push({
          userId: order.userId,
          communityEventId: order.communityEventId,
          orderId: order.id,
          ticketTypeId: type.id,
        });
      }

      // update sold
      await this.ticketTypeRepo.incrementSold(type.id, item.qty, tx);
    }

    await this.ticketRepo.createMany(ticketsPayload, tx);
  }

  async createOrder(
    userId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
      if (!items.length) throw new Error("ITEMS_REQUIRED");

      const existingTickets = await tx.communityEventTicket.count({
        where: { userId, eventId },
      });

      const newQty = items.reduce((a, b) => a + b.qty, 0);

      if (existingTickets + newQty > 2) {
        throw new Error("MAX_2_TICKETS_PER_USER");
      }

      let total = 0;

      let totalAmount = 0;

      for (const item of items) {
        const type = await this.ticketTypeRepo.findById(item.ticketTypeId, tx);

        if (!type || !type.isActive) {
          throw new Error("TICKET_NOT_AVAILABLE");
        }

        if (type.quota - type.sold < item.qty) {
          throw new Error("TICKET_SOLD_OUT");
        }

        total += Number(type.price) * item.qty;
      }

      const orderId = crypto.randomUUID();

      const qrCode = generateTicketQR({
        orderId,
        userId,
        eventId,
      });

      const order = await this.orderRepo.create(
        {
          id: orderId,
          userId,
          communityEventId: eventId,
          total: totalAmount,
          status: EventOrderStatus.PENDING,
          qrCode,
        },
        tx,
      );

      await this.invoiceRepo.create(
        {
          entityType: "COMMUNITY_EVENT_ORDER",
          entityId: order.id,
          invoiceNumber: `COM-EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          amount: totalAmount,
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
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
    userId: string,
    orderId: string,
    items: { ticketTypeId: string; qty: number }[],
    pin: string,
  ) {
    const user = await this.userRepository.findById(userId);

    if (!user) throw new Error("USER_NOT_FOUND");

    if (!user.biometricEnabled) {
      await this.userService.verifyPin(userId, pin);
    }

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

      if (!invoice) throw new Error("INVOICE_NOT_FOUND");
      if (invoice.status !== "PENDING") {
        throw new Error("INVOICE_ALREADY_PAID");
      }

      if (invoice.expiredAt && invoice.expiredAt < new Date()) {
        throw new Error("INVOICE_EXPIRED");
      }

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

  async scanQrCode(qrCode: string) {
    let payload: any;

    try {
      payload = jwt.verify(qrCode, process.env.QR_SECRET!);
    } catch {
      throw new Error("INVALID_QR_CODE");
    }

    const order = await this.orderRepo.findByQrCode(qrCode);

    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (order.userId !== payload.uid) {
      throw new Error("INVALID_OWNER");
    }

    if (order.status !== "PAID") {
      throw new Error("ORDER_NOT_PAID");
    }

    if (order.isCheckedIn) {
      throw new Error("ALREADY_USED");
    }

    return prisma.$transaction(async (tx) => {
      await this.orderRepo.lockOrder(order.id);

      await this.ticketRepo.markAsUsed(order.id);

      await this.attendanceRepo.attendance(
        order.communityEventId,
        order.userId,
        tx,
      );

      const result = await this.orderRepo.findById(order.id);

      return {
        success: true,
        message: "CHECK_IN_SUCCESS",
        data: result,
      };
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
