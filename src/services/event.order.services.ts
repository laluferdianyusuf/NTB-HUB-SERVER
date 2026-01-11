import { PrismaClient } from "@prisma/client";
import { EventOrderRepository } from "../repositories";
import crypto from "crypto";

const prisma = new PrismaClient();

export class EventOrderService {
  private eventOrderRepo = new EventOrderRepository();

  async checkout(
    userId: string,
    eventId: string,
    items: { ticketTypeId: string; qty: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      let total = 0;

      for (const item of items) {
        const type = await tx.eventTicketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (!type || !type.isActive) {
          throw new Error("TICKET_NOT_AVAILABLE");
        }

        if (type.quota - type.sold < item.qty) {
          throw new Error("TICKET_SOLD_OUT");
        }

        total += type.price * item.qty;
      }

      const order = await tx.eventOrder.create({
        data: {
          userId,
          eventId,
          total,
          status: "PENDING",
        },
      });

      const invoice = await tx.invoice.create({
        data: {
          eventOrderId: order.id,
          invoiceNumber: `EVT-${Date.now()}`,
          amount: total,
          status: "PENDING",
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          eventOrderId: order.id,
          amount: total,
          status: "PENDING",
          type: "DEDUCTION",
        },
      });

      return {
        order,
        invoice,
        transaction,
      };
    });
  }

  async markPaid(transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!trx) throw new Error("TRANSACTION_NOT_FOUND");
      if (trx.status === "SUCCESS") return;

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "SUCCESS" },
      });

      const order = await tx.eventOrder.update({
        where: { id: trx.eventOrderId! },
        data: { status: "PAID" },
      });

      await tx.invoice.update({
        where: { eventOrderId: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      const ticketTypes = await tx.eventTicketType.findMany({
        where: { eventId: order.eventId },
      });

      for (const type of ticketTypes) {
        const qty = Math.floor(order.total / type.price);
        if (qty <= 0) continue;

        await tx.eventTicket.createMany({
          data: Array.from({ length: qty }).map(() => ({
            userId: order.userId,
            eventId: order.eventId,
            orderId: order.id,
            ticketTypeId: type.id,
            qrCode: crypto.randomUUID(),
          })),
        });

        await tx.eventTicketType.update({
          where: { id: type.id },
          data: { sold: { increment: qty } },
        });
      }
    });
  }

  async getOrderDetail(orderId: string) {
    return this.eventOrderRepo.findOrderById(orderId);
  }
}
