import { EventOrderStatus, EventStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EventRepository {
  async createEvent(data: {
    venueId?: string;
    communityId?: string;
    name: string;
    description: string;
    image?: string;
    startAt: Date;
    endAt: Date;
    capacity?: number;
    latitude?: number;
    longitude?: number;
    location: string;
    isCommunity?: boolean;
    isVenue?: boolean;
    includeTicket?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.create({ data });

      await tx.account.create({
        data: {
          type: "EVENT",
          eventId: event.id,
        },
      });

      await tx.eventBalance.create({
        data: {
          eventId: event.id,
        },
      });
      return event;
    });
  }

  async getEventDashboard(eventId: string) {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eventAccount = await prisma.account.findFirst({
      where: {
        eventId,
      },
    });
    if (!eventAccount) throw new Error("Event account not found");

    const [
      groupedStatus,
      todayRevenue,
      pendingTicketOrder,
      paidTicketOrder,
      cancelledTicketOrder,
      expiredTicketOrder,
    ] = await Promise.all([
      prisma.eventOrder.groupBy({
        by: ["status"],
        where: { eventId },
        _count: {
          status: true,
        },
      }),

      prisma.ledgerEntry.aggregate({
        where: {
          accountId: eventAccount.id,
          type: "CREDIT",
          referenceType: "EVENT_PAYMENT",
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.eventOrder.findMany({
        where: {
          eventId,
          status: EventOrderStatus.PENDING,
        },
        include: {
          event: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.eventOrder.findMany({
        where: {
          eventId,
          status: EventOrderStatus.PAID,
        },
        include: {
          event: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.eventOrder.findMany({
        where: {
          eventId,
          status: EventOrderStatus.CANCELLED,
        },
        include: {
          event: true,
          tickets: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.eventOrder.findMany({
        where: {
          eventId,
          status: EventOrderStatus.EXPIRED,
        },
        include: {
          event: true,
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

    return {
      summary,
      revenueToday: totalRevenueToday,

      pending: pendingTicketOrder,
      paid: paidTicketOrder,
      cancelled: cancelledTicketOrder,
      expired: expiredTicketOrder,
    };
  }

  async findAllActiveEvents(params: {
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { status = "all", search, skip = 0, take = 10 } = params;
    const where: any = {
      isActive: true,
    };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          location: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    if (status !== "all") {
      where.status = status;
    }

    return prisma.event.findMany({
      where,
      skip,
      take,
      include: {
        venue: true,
        community: true,
        ticketTypes: true,
        tickets: true,
      },
      orderBy: { startAt: "asc" },
    });
  }

  async findAllEventsWithDetails(params: {
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { status = "all", search, skip = 0, take = 10 } = params;

    const where: any = {
      isActive: true,
    };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          location: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    if (status !== "all") {
      where.status = status;
    }

    const [events, orderAgg, ticketAgg, attendanceAgg] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        include: {
          eventBalance: true,
        },
      }),

      prisma.eventOrder.groupBy({
        by: ["eventId"],
        _sum: { total: true },
        _count: { id: true },
      }),

      prisma.eventTicket.groupBy({
        by: ["eventId"],
        _count: { id: true },
      }),

      prisma.eventAttendance.groupBy({
        by: ["eventId"],
        _count: { id: true },
      }),
    ]);

    return events.map((event) => {
      const order = orderAgg.find((o) => o.eventId === event.id);
      const ticket = ticketAgg.find((t) => t.eventId === event.id);
      const attendance = attendanceAgg.find((a) => a.eventId === event.id);

      return {
        ...event,
        summary: {
          totalOrders: order?._count.id ?? 0,
          totalRevenue: Number(order?._sum.total ?? 0),
          totalTicketsSold: ticket?._count.id ?? 0,
          totalAttendees: attendance?._count.id ?? 0,
        },
      };
    });
  }

  async countEvents(
    params: Omit<{ status?: string; search?: string }, "skip" | "take"> = {},
  ) {
    const { search, status = "all" } = params;

    const where: any = {
      isActive: true,
    };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          location: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    if (status !== "all") {
      where.status = status;
    }

    return prisma.event.count({ where });
  }

  async findEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        community: true,
        ticketTypes: true,
        tickets: true,
        orders: true,
      },
    });
  }

  async updateEventStatus(id: string, status: EventStatus) {
    return prisma.event.update({
      where: { id },
      data: { status },
    });
  }

  async deleteEvent(id: string) {
    return prisma.event.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
