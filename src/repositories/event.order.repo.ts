import { EventOrder, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class EventOrderRepository {
  createOrder(data: EventOrder) {
    return prisma.eventOrder.create({ data });
  }

  findOrderById(id: string) {
    return prisma.eventOrder.findUnique({
      where: { id },
      include: {
        invoice: true,
        tickets: true,
      },
    });
  }

  updateOrder(id: string, data: EventOrder) {
    return prisma.eventOrder.update({
      where: { id },
      data,
    });
  }
}
