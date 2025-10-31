import { PrismaClient, Payment, Booking } from "@prisma/client";

const prisma = new PrismaClient();

export class PaymentRepository {
  async findAllPayments(): Promise<Payment[]> {
    return prisma.payment.findMany({
      include: { booking: true },
    });
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });
  }

  async findPaymentFirst({
    transactionId,
    bookingId,
    orderId,
  }: {
    transactionId?: string;
    bookingId?: string;
    orderId?: string;
  }): Promise<Payment | null> {
    const conditions = [];

    if (transactionId) conditions.push({ transactionId });
    if (bookingId) conditions.push({ bookingId });
    if (orderId) conditions.push({ orderId });

    return prisma.payment.findFirst({
      where: {
        OR: conditions,
        // status: { not: "CANCELLED" },
      },
      include: { booking: true },
    });
  }

  async createPayments(data: Omit<Payment, "id">): Promise<Payment> {
    return prisma.payment.create({
      data,
    });
  }

  async updatePayments(id: string, data: Partial<Payment>) {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async updateBookingStatus(
    bookingId: string,
    status: "COMPLETED" | "CANCELLED"
  ): Promise<Booking> {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}
