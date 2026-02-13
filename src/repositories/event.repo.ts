import { PrismaClient, EventStatus } from "@prisma/client";

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
    location: string;
    isCommunity?: boolean;
    isVenue?: boolean;
  }) {
    return prisma.event.create({ data });
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
        venue: true,
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
