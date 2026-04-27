import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { generateTicketQR } from "helpers/qrCodeHelper";
import { AccountRepository } from "repositories/account.repo";
import {
  EventBalanceRepository,
  EventOrderRepository,
  EventTicketRepository,
  EventTicketTypeRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  PlatformBalanceRepository,
  UserBalanceRepository,
} from "../repositories";

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

  private async generateTickets(
    order: any,
    items: { ticketTypeId: string; qty: number }[],
    tx: any,
  ) {
    const ticketTypes = await this.eventTicketTypeRepo.findByEvent(
      order.eventId,
      tx,
    );

    const ticketsPayload: {
      id: string;
      userId: string;
      eventId: string;
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
          id: ticketId,
          userId: order.userId,
          eventId: order.eventId,
          orderId: order.id,
          ticketTypeId: type.id,
          qrCode: generateTicketQR({
            ticketId,
            userId: order.userId,
            eventId: order.eventId,
          }),
        });
      }

      // update sold
      await this.eventTicketTypeRepo.updateSold(type.id, item.qty, tx);
    }

    await this.eventTicketRepo.createMany(ticketsPayload, tx);
  }

  async checkout(
    userId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
      if (!items.length) throw new Error("ITEMS_REQUIRED");

      let total = 0;

      for (const item of items) {
        const type = await this.eventTicketTypeRepo.findById(
          tx,
          item.ticketTypeId,
        );

        if (!type || !type.isActive) {
          throw new Error("TICKET_NOT_AVAILABLE");
        }

        if (type.quota - type.sold < item.qty) {
          throw new Error("TICKET_SOLD_OUT");
        }

        total += Number(type.price) * item.qty;
      }

      const order = await this.eventOrderRepo.createOrder(tx, {
        userId,
        eventId,
        total,
        status: "PENDING",
      });

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
    });
  }

  async markPaid(
    eventOrderId: string,
    items: { ticketTypeId: string; qty: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await this.eventOrderRepo.findById(eventOrderId, tx);

      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status === "PAID") return order;

      if (order.status !== "PENDING") {
        throw new Error("INVALID_ORDER_STATUS");
      }

      const userAccount = await this.accountRepository.findUserAccount(
        order.userId,
      );
      const eventAccount = await this.accountRepository.findEventAccount(
        order.eventId,
      );
      const platformAccount =
        await this.accountRepository.findPlatformAccount();

      if (!userAccount) {
        throw new Error("User Account not found");
      }

      if (!eventAccount) {
        throw new Error("Event Account not found");
      }

      if (!platformAccount) {
        throw new Error("Platform Account not found");
      }

      const invoice = await this.invoiceRepo.findByEntity(
        "EVENT_ORDER",
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

      const balance = await this.ledgerRepository.getBalance(userAccount.id);
      const platformFee = Number(invoice.amount) * 0.1;
      const eventAmount = Number(invoice.amount) - platformFee;

      if (!balance || balance.totalBalance < Number(order.total)) {
        throw new Error("Insufficient balance");
      }

      const paymentId = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await this.ledgerRepository.createMany(
        [
          {
            accountId: userAccount?.id as string,
            type: "DEBIT",
            amount: Number(invoice.amount),
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
          amount: Number(invoice.amount),
          method: "WALLET",
          provider: "NTB_HUB",
          providerRef: paymentId,
        },
        tx,
      );

      await this.invoiceRepo.markPaid(invoice.id, tx);
      await this.eventOrderRepo.updateOrderStatus(tx, order.id, "PAID");

      await this.generateTickets(order, items, tx);

      return order;
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
