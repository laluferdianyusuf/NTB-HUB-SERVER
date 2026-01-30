import { PointActivityType, PrismaClient } from "@prisma/client";
import {
  EventOrderRepository,
  EventTicketRepository,
  EventTicketTypeRepository,
  InvoiceRepository,
  PointsRepository,
  TransactionRepository,
  UserBalanceRepository,
} from "../repositories";
import crypto from "crypto";
import { generateTicketQR } from "helpers/qrCodeHelper";

const prisma = new PrismaClient();

export class EventOrderService {
  private eventOrderRepo = new EventOrderRepository();
  private eventTicketRepo = new EventTicketRepository();
  private eventTicketTypeRepo = new EventTicketTypeRepository();
  private invoiceRepo = new InvoiceRepository();
  private transRepo = new TransactionRepository();
  private userBalanceRepo = new UserBalanceRepository();
  private pointRepo = new PointsRepository();

  async checkout(
    userId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[],
  ) {
    return prisma.$transaction(async (tx) => {
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

        total += type.price * item.qty;
      }

      const order = await this.eventOrderRepo.createOrder(tx, {
        userId,
        eventId,
        total,
        status: "PENDING",
      });

      const eventNumber = `EVT-${crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

      await this.invoiceRepo.create(
        {
          eventOrderId: order.id,
          invoiceNumber: eventNumber,
          amount: total,
          status: "PENDING",
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        tx,
      );

      await this.transRepo.create(
        {
          userId,
          eventOrderId: order.id,
          amount: total,
          status: "PENDING",
          type: "EVENT",
          reference: order.id,
          orderId: eventNumber,
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
      const trx = await this.transRepo.findByOrderId(eventOrderId, tx);
      if (!trx) throw new Error("TRANSACTION_NOT_FOUND");
      if (trx.status === "SUCCESS") return;

      await this.transRepo.updateStatus(trx.id, "SUCCESS", tx);

      const order = await this.eventOrderRepo.updateOrderStatus(
        tx,
        eventOrderId,
        "PAID",
      );

      await this.invoiceRepo.updateInvoiceByEventOrderId(order.id, "PAID", tx);

      const ticketTypes = await this.eventTicketTypeRepo.findByEvent(
        order.eventId,
        tx,
      );

      await this.userBalanceRepo.decrementBalance(
        order.userId,
        order.total,
        tx,
      );

      await this.pointRepo.generatePoints(
        {
          userId: order.userId,
          activity: "EVENT_PURCHASE",
          points: 10,
          reference: order.id,
        },
        tx,
      );

      const ticketsPayload: {
        userId: string;
        eventId: string;
        orderId: string;
        ticketTypeId: string;
        qrCode: string;
      }[] = [];

      for (const item of items) {
        const type = ticketTypes.find((t) => t.id === item.ticketTypeId);

        if (!type) continue;

        for (let i = 0; i < item.qty; i++) {
          const ticketId = crypto.randomUUID();
          ticketsPayload.push({
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

        await this.eventTicketTypeRepo.updateSold(type.id, item.qty, tx);
      }

      await this.eventTicketRepo.createMany(ticketsPayload, tx);

      const tickets = await this.eventTicketRepo.findByOrderId(order.id, tx);

      return { order, tickets };
    });
  }

  async getOrderDetail(orderId: string) {
    return this.eventOrderRepo.findById(orderId);
  }
}
