import {
  PrismaClient,
  Booking,
  BookingStatus,
  TableStatus,
  Prisma,
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

  async createBooking(
    data: Booking,
    tx: Prisma.TransactionClient
  ): Promise<Booking> {
    return await tx.booking.create({
      data,
    });
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking> {
    return await prisma.booking.update({ where: { id }, data: { status } });
  }

  async processBookingPayment(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const updatedBooking = await db.booking.update({
      where: { id: id },
      data: { status: BookingStatus.PAID },
    });

    return {
      updatedBooking,
    };
  }

  async cancelBooking(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const booking = await db.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    return { booking };
  }

  async completeBooking(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return await db.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });
  }

  async updateBookingTotal(
    bookingId: string,
    totalIncrease: number,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.booking.update({
      where: { id: bookingId },
      data: { totalPrice: { increment: totalIncrease } },
      include: { invoice: true },
    });
  }

  async recalculateBookingTotal(
    bookingId: string,
    tx: Prisma.TransactionClient
  ) {
    const total = await tx.orderItem.aggregate({
      where: { bookingId },
      _sum: { subtotal: true },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: { totalPrice: total._sum.subtotal || 0 },
    });
  }
}
