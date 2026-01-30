import {
  EventTicket,
  Prisma,
  PrismaClient,
  TicketStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export class EventTicketRepository {
  findByQrCode(qrCode: string) {
    return prisma.eventTicket.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: true,
        ticketType: true,
      },
    });
  }

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

  markAsUsed(ticketId: string) {
    return prisma.eventTicket.updateMany({
      where: {
        id: ticketId,
        status: "ACTIVE",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });
  }
}
