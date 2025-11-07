import { PrismaClient, Invoice, Prisma, InvoiceStatus } from "@prisma/client";
const prisma = new PrismaClient();

export class InvoiceRepository {
  async findAll(): Promise<Invoice[]> {
    return prisma.invoice.findMany();
  }
  async findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({ where: { id } });
  }

  async findByBookingId(bookingId: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({
      where: { bookingId },
    });
  }

  async create(
    data: Prisma.InvoiceUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Invoice> {
    const db = tx ?? prisma;
    return db.invoice.create({ data });
  }

  async updateInvoicePaid(bookingId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.invoice.update({
      where: { bookingId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  async updateInvoiceCanceled(
    bookingId: string,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.invoice.update({
      where: { bookingId },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async updateInvoiceAmount(
    bookingId: string,
    totalIncrease: number,
    tx: Prisma.TransactionClient
  ) {
    return tx.invoice.update({
      where: { bookingId },
      data: { amount: { increment: totalIncrease } },
    });
  }
}
