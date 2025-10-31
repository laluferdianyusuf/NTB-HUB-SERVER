import { PrismaClient, OrderItem as PrismaOrder } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderRepository {
  // find all order by booking
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

  //   create new order at booking
  async addOrderItem({
    bookingId,
    menuId,
    quantity,
    subtotal,
  }: {
    bookingId: string;
    menuId: string;
    quantity: number;
    subtotal: number;
  }): Promise<PrismaOrder> {
    // const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    // if (!menu) throw new Error("Menu not found");

    // const subtotal = menu.price * quantity;

    const order = await prisma.orderItem.create({
      data: { bookingId, menuId, quantity, subtotal },
    });

    // update total booking
    const total = await prisma.orderItem.aggregate({
      where: { bookingId },
      _sum: { subtotal: true },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { totalPrice: total._sum.subtotal || 0 },
    });

    return order;
  }

  // update order
  async updateOrder(
    id: string,
    bookingId: string,
    quantity: number,
    subtotal: number
  ) {
    // const item = await prisma.orderItem.findUnique({ where: { id } });
    // if (!item) throw new Error("Order not found");

    // const menu = await prisma.menu.findUnique({ where: { id: item.menuId } });
    // const subtotal = (menu?.price || 0) * quantity;

    const updated = await prisma.orderItem.update({
      where: { id },
      data: { quantity, subtotal },
    });

    // update total booking
    const total = await prisma.orderItem.aggregate({
      where: { bookingId: bookingId },
      _sum: { subtotal: true },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { totalPrice: total._sum.subtotal || 0 },
    });

    return updated;
  }

  // delete order
  async deleteOrder(id: string) {
    const order = await prisma.orderItem.delete({ where: { id } });

    const total = await prisma.orderItem.aggregate({
      where: { bookingId: order.bookingId },
      _sum: { subtotal: true },
    });

    await prisma.booking.update({
      where: { id: order.bookingId },
      data: { totalPrice: total._sum.subtotal || 0 },
    });

    return order;
  }
}
