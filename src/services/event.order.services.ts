import {
  EventOrder,
  EventOrderStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import crypto from "crypto";
import { generateTicketQR } from "helpers/qrCodeHelper";
import jwt from "jsonwebtoken";
import {
  AccountRepository,
  ActivityLogRepository,
  EventAttendanceRepository,
  EventBalanceRepository,
  EventOrderRepository,
  EventTicketRepository,
  EventTicketTypeRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  PlatformBalanceRepository,
  UserBalanceRepository,
  UserRepository,
} from "../repositories";
import { UserService } from "./user.services";

const prisma = new PrismaClient();

export class EventOrderService {
  private eventOrderRepo = new EventOrderRepository();
  private eventTicketRepo = new EventTicketRepository();
  private eventTicketTypeRepo = new EventTicketTypeRepository();
  private invoiceRepo = new InvoiceRepository();
  private paymentRepo = new PaymentRepository();
  private userBalanceRepo = new UserBalanceRepository();
  private ledgerRepository = new LedgerRepository();
  private accountRepository = new AccountRepository();
  private eventBalanceRepository = new EventBalanceRepository();
  private platformBalanceRepository = new PlatformBalanceRepository();
  private userRepository = new UserRepository();
  private userService = new UserService();
  private attendanceRepo = new EventAttendanceRepository();
  private activityLogRepository = new ActivityLogRepository();

  async checkout(
    selectedUserId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[],
    tx: Prisma.TransactionClient,
  ) {
    if (!items.length) throw new Error("Tickets required");

    const existingTickets = await tx?.eventTicket.count({
      where: { userId: selectedUserId, eventId },
    });

    const newQty = items.reduce((a, b) => a + b.qty, 0);

    if (existingTickets + newQty > 2) {
      throw new Error("Max 2 tickets per user");
    }

    let total = 0;

    for (const item of items) {
      const type = await this.eventTicketTypeRepo.findById(
        tx,
        item.ticketTypeId,
      );

      if (!type || !type.isActive) {
        throw new Error("Ticket not available");
      }

      if (type.quota - type.sold < item.qty) {
        throw new Error("Ticket sold out");
      }

      total += Number(type.price) * item.qty;
    }

    const orderId = crypto.randomUUID();

    const qrCode = generateTicketQR({
      orderId,
      userId: selectedUserId,
      eventId,
    });

    const order = await this.eventOrderRepo.createOrder(
      tx as Prisma.TransactionClient,
      {
        id: orderId,
        userId: selectedUserId,
        eventId,
        total,
        status: EventOrderStatus.PENDING,
        qrCode,
      },
    );

    const invoiceNumber = `EVT-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    await this.invoiceRepo.create(
      {
        entityType: "EVENT_ORDER",
        entityId: order.id,
        invoiceNumber,
        amount: total,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      tx,
    );

    return order;
  }

  async markPaid(
    userId: string,
    orderId: string,
    tx: Prisma.TransactionClient,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const order = await this.eventOrderRepo.findById(orderId, tx);
    if (!order) throw new Error("Order not found");

    if (order.status === "PAID") return order;
    if (order.status !== "PENDING") {
      throw new Error("Invalid order status");
    }

    const invoice = await this.invoiceRepo.findByEntity(
      "EVENT_ORDER",
      order.id,
      tx,
    );

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status !== "PENDING") {
      throw new Error("Invoice already paid");
    }

    if (invoice.expiredAt && invoice.expiredAt < new Date()) {
      throw new Error("Invoice expired");
    }

    const userAccount = await this.accountRepository.findUserAccount(userId);
    const eventAccount = await this.accountRepository.findEventAccount(
      order.eventId,
    );
    const platformAccount = await this.accountRepository.findPlatformAccount();

    if (!userAccount) {
      throw new Error("User Account not found");
    }

    if (!eventAccount) {
      throw new Error("Event Account not found");
    }

    if (!platformAccount) {
      throw new Error("Platform Account not found");
    }

    const balance = await this.ledgerRepository.getBalance(userAccount.id);

    if (!balance || Number(balance.totalBalance) < Number(order.total)) {
      throw new Error("Insufficient balance");
    }

    const platformFee = Number(order.total) * 0.1;
    const eventAmount = Number(order.total) - platformFee;

    await this.ledgerRepository.createMany(
      [
        {
          accountId: userAccount.id,
          type: "DEBIT",
          amount: Number(order.total),
          referenceType: "EVENT_PAYMENT",
          referenceId: order.id,
        },
        {
          accountId: eventAccount.id,
          type: "CREDIT",
          amount: eventAmount,
          referenceType: "EVENT_PAYMENT",
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
      order.eventId,
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
        amount: Number(order.total),
        method: "WALLET",
        provider: "NTB_HUB",
        providerRef: `PAY-${crypto.randomUUID().slice(0, 8)}`,
      },
      tx,
    );

    await this.activityLogRepository.create(
      {
        actorId: userId,
        actorType: "USER",
        entityType: "EVENT",
        entityId: order.id,
        action: "PAID",
        metadata: {
          amount: Number(invoice.amount),
        },
      },
      tx,
    );

    await this.invoiceRepo.markPaid(invoice.id, tx);
    await this.eventOrderRepo.updateOrderStatus(
      tx as Prisma.TransactionClient,
      order.id,
      "PAID",
    );

    return order;
  }

  async checkoutAndPay(
    userId: string,
    selectedUserId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[],
    pin: string,
  ) {
    await this.userService.verifyPin(userId, pin);

    return prisma.$transaction(async (tx) => {
      const order = await this.checkout(selectedUserId, eventId, items, tx);

      await this.markPaid(userId, order.id, tx);

      await this.generateTickets(order, items, tx);

      return order;
    });
  }

  private async generateTickets(
    order: EventOrder,
    items: { ticketTypeId: string; qty: number }[],
    tx: Prisma.TransactionClient,
  ) {
    const payload: {
      userId: string;
      eventId: string;
      orderId: string;
      ticketTypeId: string;
    }[] = [];

    for (const item of items) {
      const type = await this.eventTicketTypeRepo.findById(
        tx,
        item.ticketTypeId,
      );
      if (!type) throw new Error("Ticket type not found");

      await this.eventTicketTypeRepo.updateSold(type.id, item.qty, tx);

      for (let i = 0; i < item.qty; i++) {
        payload.push({
          userId: order.userId,
          eventId: order.eventId,
          orderId: order.id,
          ticketTypeId: type.id,
        });
      }
    }

    await this.eventTicketRepo.createMany(payload, tx);
  }

  async scanQrCode(qrCode: string) {
    let payload: any;

    try {
      payload = jwt.verify(qrCode, process.env.QR_SECRET!);
    } catch {
      throw new Error("Invalid qr code");
    }

    const order = await this.eventOrderRepo.findByQrCode(qrCode);

    if (!order) throw new Error("Order not found");

    if (order.userId !== payload.uid) {
      throw new Error("Invalid owner");
    }

    if (order.status !== "PAID") {
      throw new Error("Order not found");
    }

    if (order.isCheckedIn) {
      throw new Error("Already used");
    }

    return prisma.$transaction(async (tx) => {
      await this.eventOrderRepo.lockOrder(order.id);

      await this.eventTicketRepo.markAsUsed(order.id);

      await this.attendanceRepo.attendance(order.eventId, order.userId, tx);

      const result = await this.eventOrderRepo.findById(order.id);

      return {
        success: true,
        message: "Check-In Success",
        data: result,
      };
    });
  }

  async getUserEvents(userId: string) {
    const orders = await this.eventOrderRepo.getUserEvents(userId);

    if (!orders) {
      throw new Error("Ticket not found");
    }

    return orders;
  }

  async getEventsOrder(eventId: string) {
    const orders = await this.eventOrderRepo.getEventsOrder(eventId);

    if (!orders) {
      throw new Error("Ticket not found");
    }

    return orders;
  }

  async getOrderDetail(orderId: string) {
    return this.eventOrderRepo.findById(orderId);
  }
}
