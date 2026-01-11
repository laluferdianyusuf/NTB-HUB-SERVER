import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class EventRepository {
  async create(data: {
    venueId: string;
    name: string;
    description: string;
    image?: string;
    startAt: Date;
    endAt: Date;
    capacity?: number;
  }) {
    return prisma.event.create({ data });
  }

  async findAllActive() {
    return prisma.event.findMany({
      where: { isActive: true },
      include: {
        venue: true,
        ticketTypes: true,
      },
      orderBy: { startAt: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        ticketTypes: true,
      },
    });
  }

  async updateStatus(id: string, status: EventStatus) {
    return prisma.event.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return prisma.event.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
