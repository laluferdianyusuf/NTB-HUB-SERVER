import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EventTicketTypeRepository {
  async create(data: {
    eventId: string;
    name: string;
    price: number;
    quota: number;
    description: string;
  }) {
    return prisma.eventTicketType.create({ data });
  }

  async findByEvent(eventId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventTicketType.findMany({
      where: { eventId, isActive: true },
      orderBy: { price: "asc" },
    });
  }

  async findById(tx: Prisma.TransactionClient, id: string) {
    const db = tx ?? prisma;
    return db.eventTicketType.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      quota: number;
      isActive: boolean;
    }>,
  ) {
    return prisma.eventTicketType.update({
      where: { id },
      data,
    });
  }

  async updateSold(id: string, qty: number, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.eventTicketType.update({
      where: { id: id },
      data: { sold: { increment: qty } },
    });
  }

  async delete(id: string) {
    return prisma.eventTicketType.delete({ where: { id } });
  }
}
