import {
  EventOrder,
  EventOrderStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
const prisma = new PrismaClient();

export class EventOrderRepository {
  createOrder(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      eventId: string;
      total: number;
      status: EventOrderStatus;
    },
  ) {
    return tx.eventOrder.create({ data });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventOrder.findUnique({
      where: { id },
      include: {
        items: true,
        invoice: true,
        tickets: true,
      },
    });
  }

  updateOrder(tx: Prisma.TransactionClient, id: string, data: EventOrder) {
    return tx.eventOrder.update({
      where: { id },
      data,
    });
  }

  updateOrderStatus(
    tx: Prisma.TransactionClient,
    id: string,
    status: EventOrderStatus,
  ) {
    return tx.eventOrder.update({
      where: { id },
      data: { status: status },
    });
  }

  markPaid(tx: Prisma.TransactionClient, id: string) {
    return tx.eventOrder.update({
      where: { id },
      data: { status: "PAID" },
    });
  }

  getUserEvents(userId: string) {
    return prisma.eventOrder.findMany({
      where: {
        userId,
        status: "PAID",
      },
      select: {
        createdAt: true,
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            startAt: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  }
}
