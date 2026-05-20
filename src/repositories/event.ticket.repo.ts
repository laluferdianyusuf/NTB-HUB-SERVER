import { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma";

export class EventTicketRepository {
  createMany(
    tickets: Prisma.EventTicketCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;
    const res = db.eventTicket.createMany({ data: tickets });

    return res;
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventTicket.findUnique({
      where: { id },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventTicket.findMany({
      where: { userId },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  findByOrderId(orderId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventTicket.findMany({
      where: { orderId },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  markAsUsed(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.eventTicket.updateMany({
      where: {
        orderId,
        status: "ACTIVE",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });
  }
}
