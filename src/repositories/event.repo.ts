import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class EventRepository {
  async createEvent(data: {
    venueId?: string;
    ownerId: string;
    name: string;
    description: string;
    image?: string;
    startAt: Date;
    endAt: Date;
    capacity?: number;
    location: string;
  }) {
    return prisma.event.create({ data });
  }

  async findAllActiveEvents() {
    return prisma.event.findMany({
      where: { isActive: true },
      include: {
        venue: true,
        owner: true,
        ticketTypes: true,
        tickets: true,
      },
      orderBy: { startAt: "asc" },
    });
  }

  async findEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        owner: true,
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
