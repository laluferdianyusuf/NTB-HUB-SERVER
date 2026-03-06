import { Prisma, PrismaClient, OrderItem as PrismaOrder } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderItemRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createOrder(
    data: {
      orderId: string;
      menuId: string;
      quantity: number;
      subtotal: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    await client.orderItem.create({
      data,
    });
  }
  async getOrders(bookingId: string) {
    return prisma.orderItem.findMany({
      where: { bookingId },
      include: { menu: true },
    });
  }

  async getOrderById(id: string) {
    return prisma.orderItem.findUnique({
      where: { id },
      include: { menu: true },
    });
  }

  async createBulkOrders(
    data: {
      orderId: string;
      menuId: string;
      quantity: number;
      price: Prisma.Decimal | number;
      subtotal: number;
    }[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.orderItem.createMany({
      data,
    });
  }

  // update order
  async updateOrder(
    id: string,
    quantity: number,
    subtotal: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderItem.update({
      where: { id },
      data: { quantity, subtotal },
    });
  }

  // delete order
  async deleteOrder(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.orderItem.delete({ where: { id } });
  }

  async findAllOrders(): Promise<PrismaOrder[]> {
    return await prisma.orderItem.findMany({
      include: {
        booking: true,
        menu: true,
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<PrismaOrder[]> {
    return await prisma.orderItem.findMany({
      where: { bookingId },
      include: {
        menu: true,
      },
    });
  }
}
