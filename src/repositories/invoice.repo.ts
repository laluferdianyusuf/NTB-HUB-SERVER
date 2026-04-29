import {
  Invoice,
  InvoiceEntityType,
  InvoiceStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "config/prisma";

export class InvoiceRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }
  async create(
    data: {
      entityType: InvoiceEntityType;
      entityId: string;
      invoiceNumber: string;
      amount: number;
      expiredAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.invoice.create({
      data,
    });
  }

  async getInvoicesByBookingIds(bookingIds: string[]) {
    return prisma.invoice.findMany({
      where: {
        entityType: InvoiceEntityType.BOOKING,
        entityId: { in: bookingIds },
        status: InvoiceStatus.PAID,
      },
      select: {
        entityId: true,
        amount: true,
      },
    });
  }

  async findActiveByEntity(
    entityType: InvoiceEntityType,
    entityId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.invoice.findFirst({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvoicesByVenue(venueId: string, fromDate: Date) {
    const bookings = await prisma.booking.findMany({
      where: { venueId },
      select: { id: true },
    });

    const bookingIds = bookings.map((b) => b.id);

    if (!bookingIds.length) return [];

    return prisma.invoice.findMany({
      where: {
        entityType: "BOOKING",
        entityId: {
          in: bookingIds,
        },
        createdAt: {
          gte: fromDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getPaidInvoicesThisMonth(venueId: string, monthStart: Date) {
    const bookings = await prisma.booking.findMany({
      where: { venueId },
      select: { id: true },
    });

    const ids = bookings.map((x) => x.id);

    return prisma.invoice.findMany({
      where: {
        entityType: "BOOKING",
        entityId: { in: ids },
        status: "PAID",
        createdAt: {
          gte: monthStart,
        },
      },
    });
  }

  async getPendingInvoices(venueId: string) {
    const bookings = await prisma.booking.findMany({
      where: { venueId },
      select: { id: true },
    });

    const ids = bookings.map((x) => x.id);

    return prisma.invoice.findMany({
      where: {
        entityType: "BOOKING",
        entityId: { in: ids },
        status: "PENDING",
      },
    });
  }

  async findActiveByIds(bookingIds: string[], tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);

    return client.invoice.findMany({
      where: {
        entityType: "BOOKING",
        entityId: {
          in: bookingIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async markPaid(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }

  async markExpired(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.EXPIRED },
    });
  }

  async markFailed(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  async cancelByEntity(
    entityType: InvoiceEntityType,
    entityId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.invoice.updateMany({
      where: {
        entityType,
        entityId,
        status: {
          in: ["PENDING"],
        },
      },
      data: {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
    });
  }

  async findByEntity(
    entityType: InvoiceEntityType,
    entityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Invoice | null> {
    const client = tx ?? prisma;

    return client.invoice.findFirst({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
  }

  async findAllInvoices(
    limit = 20,
    cursor?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.invoice.findMany({
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: "desc" },
    });
  }
}
