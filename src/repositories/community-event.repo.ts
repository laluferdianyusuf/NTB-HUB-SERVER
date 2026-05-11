import { EventOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityEventRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }
  findCommunityEvents(
    params: {
      search?: string;
      skip?: number;
      take?: number;
    } = {},
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    const { search, skip = 0, take = 10 } = params;

    const where: Prisma.CommunityEventWhereInput = {};

    if (search) {
      const words = search.split(" ");

      where.OR = words.flatMap((word) => [
        { title: { contains: word, mode: "insensitive" } },
        { location: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
      ]);
    }

    return db.communityEvent.findMany({
      where,
      orderBy: { startAt: "asc" },
      skip,
      take,
      include: {
        createdBy: {
          select: { id: true, name: true, photo: true },
        },
        community: {
          select: { id: true, name: true, image: true },
        },
      },
    });
  }

  async getCommunityEventDashboard(eventId: string) {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eventAccount = await prisma.account.findFirst({
      where: {
        communityEventId: eventId,
      },
    });
    if (!eventAccount) throw new Error("Community event account not found");

    const [
      groupedStatus,
      todayRevenue,
      pendingTicketOrder,
      paidTicketOrder,
      cancelledTicketOrder,
      expiredTicketOrder,
    ] = await Promise.all([
      prisma.communityEventOrder.groupBy({
        by: ["status"],
        where: { communityEventId: eventId },
        _count: {
          status: true,
        },
      }),

      prisma.ledgerEntry.aggregate({
        where: {
          accountId: eventAccount.id,
          type: "CREDIT",
          referenceType: "COMMUNITY_EVENT_PAYMENT",
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.communityEventOrder.findMany({
        where: {
          communityEventId: eventId,
          status: EventOrderStatus.PENDING,
        },
        include: {
          communityEvent: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.communityEventOrder.findMany({
        where: {
          communityEventId: eventId,
          status: EventOrderStatus.PAID,
        },
        include: {
          communityEvent: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.communityEventOrder.findMany({
        where: {
          communityEventId: eventId,
          status: EventOrderStatus.CANCELLED,
        },
        include: {
          communityEvent: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.communityEventOrder.findMany({
        where: {
          communityEventId: eventId,
          status: EventOrderStatus.EXPIRED,
        },
        include: {
          communityEvent: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    const summary = {
      pending: 0,
      paid: 0,
      cancelled: 0,
      expired: 0,
    };

    const totalRevenueToday = Number(todayRevenue._sum.amount ?? 0);

    for (const row of groupedStatus) {
      summary[row.status.toLowerCase() as keyof typeof summary] =
        row._count.status;
    }
    console.log(todayRevenue);

    return {
      summary,
      revenueToday: totalRevenueToday,

      pending: pendingTicketOrder,
      paid: paidTicketOrder,
      cancelled: cancelledTicketOrder,
      expired: expiredTicketOrder,
    };
  }

  findByCommunity(
    communityId: string,
    params: { skip?: number; take?: number } = {},
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEvent.findMany({
      where: { communityId },
      orderBy: { startAt: "asc" },
      skip: params.skip,
      take: params.take,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.communityEvent.findUnique({
      where: { id },
      include: {
        community: true,
        collaborations: true,
        communityEventTicketTypes: {
          select: {
            id: true,
            price: true,
            quota: true,
            sold: true,
          },
        },
        communityEventTickets: true,
      },
    });
  }

  findByDateRange(communityId: string, start: Date, end: Date) {
    return prisma.communityEvent.findMany({
      where: {
        communityId,
        startAt: { gte: start, lte: end },
      },
      orderBy: { startAt: "asc" },
    });
  }

  async create(
    data: Prisma.CommunityEventCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);

    const event = await db.communityEvent.create({ data });

    await db.account.create({
      data: {
        type: "COMMUNITY",
        communityEventId: event.id,
      },
    });

    return event;
  }

  update(
    id: string,
    data: Prisma.CommunityEventUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEvent.update({ where: { id }, data });
  }

  delete(id: string, tx?: Prisma.TransactionClient) {
    const db = this.transaction(tx);
    return db.communityEvent.delete({ where: { id } });
  }
}
