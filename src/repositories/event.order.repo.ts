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
      id: string;
      userId: string;
      eventId: string;
      total: number;
      status: EventOrderStatus;
      qrCode: string;
    },
  ) {
    return tx.eventOrder.create({ data });
  }

  findByQrCode(qrCode: string) {
    return prisma.eventOrder.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: true,
        tickets: {
          include: {
            ticketType: true,
          },
        },
      },
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventOrder.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            location: true,
            startAt: true,
            endAt: true,
          },
        },
        tickets: {
          select: {
            id: true,
            status: true,
            ticketType: true,
            ticketTypeId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            email: true,
          },
        },
      },
    });
  }

  lockOrder(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventOrder.update({
      where: { id: id },
      data: {
        isCheckedIn: true,
        checkedInAt: new Date(),
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
        id: true,
        createdAt: true,
        tickets: true,
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            location: true,
            startAt: true,
            endAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            email: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  }

  getEventsOrder(eventId: string) {
    return prisma.eventOrder.findMany({
      where: {
        eventId,
        status: "PAID",
      },
      select: {
        createdAt: true,
        tickets: true,
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            startAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
            username: true,
            communityMemberships: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  }
}
