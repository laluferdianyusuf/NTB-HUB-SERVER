import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EventTicketTypeRepository {
  async create(data: {
    eventId: string;
    name: string;
    price: number;
    quota: number;
  }) {
    return prisma.eventTicketType.create({ data });
  }

  async findByEvent(eventId: string) {
    return prisma.eventTicketType.findMany({
      where: { eventId, isActive: true },
      orderBy: { price: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.eventTicketType.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      quota: number;
      isActive: boolean;
    }>
  ) {
    return prisma.eventTicketType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.eventTicketType.delete({ where: { id } });
  }
}
