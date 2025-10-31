import { PrismaClient, Booking, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class BookingRepository {
  async findAllBooking(): Promise<Booking[]> {
    return prisma.booking.findMany();
  }

  async findBookingById(id: string): Promise<Booking | null> {
    return prisma.booking.findUnique({ where: { id } });
  }

  async findBookingByUserId(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({ where: { userId } });
  }

  async createBooking(data: Booking): Promise<Booking> {
    return prisma.booking.create({
      data,
    });
  }

  async updateBookingStatus(
    id: string,
    status: Partial<BookingStatus>
  ): Promise<Booking> {
    return prisma.booking.update({ where: { id }, data: { status } });
  }

  async updateBooking(id: string, paymentId: string): Promise<Booking> {
    return prisma.booking.update({ where: { id }, data: { paymentId } });
  }
}
