import { EventStatus, PrismaClient } from "@prisma/client";

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

      await tx.eventBalance.create({
        data: {
          eventId: event.id,
        },
      });
      return event;
    });
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
