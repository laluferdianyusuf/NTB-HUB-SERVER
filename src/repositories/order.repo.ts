import {
  Booking,
  BookingStatus,
  InvoiceStatus,
  OrderItem,
  PointActivityType,
  Prisma,
  PrismaClient,
  OrderItem as PrismaOrder,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

const prisma = new PrismaClient();

export class OrderRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createOrder(
    data: {
      bookingId: string;
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
    bookingId: string,
    items: { menuId: string; quantity: number; subtotal: number }[],
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;
    return await db.orderItem.createMany({
      data: items.map((item) => ({
        bookingId,
        menuId: item.menuId,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
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
    const order = await prisma.orderItem.create({
      data: { bookingId, menuId, quantity, subtotal },
    });

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
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<PrismaOrder[]> {
    return await prisma.orderItem.findMany({
      where: { bookingId },
      include: {
        menu: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async processOrdersPayment(
    booking: Booking,
    paymentId: string,
    points: number,
  ) {
    return await prisma.$transaction(async (tx) => {
      const updateBalance = await tx.userBalance.update({
        where: { userId: booking.userId },
        data: { balance: { decrement: booking.totalPrice } },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAID },
      });

      await tx.invoice.update({
        where: { bookingId: booking.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      const notification = await tx.notification.create({
        data: {
          userId: booking.userId,
          title: "Payment Successful",
          message: `Thank you! Your payment of ${booking.totalPrice} has been successfully received.`,
        },
      });

      const createdPoint = await tx.point.create({
        data: {
          userId: booking.userId,
          activity: PointActivityType.BOOKING,
          points,
          reference: booking.id,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: booking.userId,
          venueId: booking.venueId,
          amount: booking.totalPrice,
          type: TransactionType.DEDUCTION,
          status: TransactionStatus.SUCCESS,
          reference: booking.id,
          orderId: paymentId,
        },
      });

      return {
        updateBalance,
        updatedBooking,
        createdPoint,
        transaction,
        notification,
      };
    });
  }
}
