import {
  PrismaClient,
  Booking,
  BookingStatus,
  TransactionType,
  TransactionStatus,
  PointActivityType,
  InvoiceStatus,
  TableStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export class BookingRepository {
  async findAllBooking(): Promise<Booking[]> {
    return await prisma.booking.findMany();
  }

  async findBookingById(id: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({ where: { id } });
  }

  async findBookingByUserId(userId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({ where: { userId } });
  }

  async resetExpiredBookings() {
    const now = new Date();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        endTime: { lt: now },
        status: { in: [BookingStatus.PAID] },
      },
    });

    if (expiredBookings.length === 0) return 0;

    await prisma.$transaction(async (tx) => {
      for (const booking of expiredBookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.COMPLETED },
        });

        await tx.table.update({
          where: { id: booking.tableId },
          data: { status: TableStatus.AVAILABLE },
        });
      }
    });

    console.log(
      `[AUTO-RESET] ${expiredBookings.length} booking expired has been completed.`
    );

    return expiredBookings.length;
  }

  async existingBooking(
    tableId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Booking> {
    return await prisma.booking.findFirst({
      where: {
        tableId,
        status: { in: [BookingStatus.PENDING, BookingStatus.PAID] },
        startTime: { lte: endTime },
        endTime: { gte: startTime },
      },
    });
  }

  async createBooking(data: Booking, invoiceNumber: string): Promise<Booking> {
    return await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data,
      });

      const invoice = await tx.invoice.create({
        data: {
          bookingId: createdBooking.id,
          invoiceNumber: invoiceNumber,
          amount: createdBooking.totalPrice,
          paymentMethod: TransactionType.DEDUCTION,
        },
      });

      return { ...createdBooking, invoice };
    });
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking> {
    return await prisma.booking.update({ where: { id }, data: { status } });
  }

  async processBookingPayment(
    booking: Booking,
    paymentId: string,
    points: number
  ) {
    return await prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.userBalance.update({
        where: { userId: booking.userId },
        data: { balance: { decrement: booking.totalPrice } },
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

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAID },
      });

      await tx.table.update({
        where: { id: booking.tableId },
        data: { status: TableStatus.BOOKED },
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
        updatedBooking,
        updatedBalance,
        createdPoint,
        transaction,
        notification,
      };
    });
  }

  async cancelBooking(id: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
      });

      const invoice = await tx.invoice.update({
        where: { bookingId: id },
        data: { status: InvoiceStatus.CANCELLED, cancelledAt: new Date() },
      });

      return { ...booking, invoice };
    });
  }

  async completeBooking(id: string) {
    return await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });
  }
}
