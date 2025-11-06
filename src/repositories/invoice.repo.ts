import { PrismaClient, Invoice } from "@prisma/client";
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

  async create(data: Invoice): Promise<Partial<Invoice>> {
    return prisma.invoice.create({ data });
  }
}
