import { PrismaClient, Invoice, Prisma, InvoiceStatus } from "@prisma/client";
const prisma = new PrismaClient();

export class InvoiceRepository {
  async findAll(): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            totalPrice: true,
            review: {
              select: {
                rating: true,
              },
            },
            venue: {
              select: {
                name: true,
              },
            },
            table: {
              select: {
                image: true,
                floor: true,
                tableNumber: true,
              },
            },
            orderItems: {
              select: {
                quantity: true,
                menu: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllByUserId(userId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        booking: {
          userId,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            totalPrice: true,
            review: {
              select: {
                rating: true,
              },
            },
            venue: {
              select: {
                name: true,
              },
            },
            table: {
              select: {
                image: true,
                floor: true,
                tableNumber: true,
              },
            },
            orderItems: {
              select: {
                quantity: true,
                menu: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findAllByVenueId(venueId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        booking: {
          venueId,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            totalPrice: true,

            user: {
              select: {
                name: true,
              },
            },
            review: {
              select: {
                rating: true,
              },
            },
            venue: {
              select: {
                name: true,
              },
            },
            table: {
              select: {
                image: true,
                floor: true,
                tableNumber: true,
              },
            },
            orderItems: {
              select: {
                quantity: true,
                menu: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            totalPrice: true,
            review: {
              select: { rating: true },
            },
            venue: {
              select: { name: true },
            },
            table: {
              select: {
                image: true,
                tableNumber: true,
                floor: true,
              },
            },
            orderItems: {
              select: {
                quantity: true,
                menu: true,
              },
            },
          },
        },
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({
      where: { bookingId },
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            totalPrice: true,
            user: {
              select: {
                name: true,
                address: true,
                email: true,
                photo: true,
              },
            },
            venue: {
              select: {
                name: true,
              },
            },
            orderItems: {
              select: {
                quantity: true,
                menu: true,
              },
            },
            table: {
              select: {
                image: true,
                floor: true,
                tableNumber: true,
              },
            },
          },
        },
      },
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
        expiredAt: null,
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

  async findExpiredInvoices(now: Date, tx?: PrismaClient) {
    const db = tx ?? prisma;

    return db.invoice.findMany({
      where: {
        status: "PENDING",
        expiredAt: { lt: now },
      },
      include: {
        booking: true,
      },
    });
  }

  async markInvoiceExpired(invoiceId: string, tx?: PrismaClient) {
    const db = tx ?? prisma;

    return db.$transaction(async (trx) => {
      const invoice = await trx.invoice.update({
        where: { id: invoiceId },
        data: { status: "EXPIRED" },
        select: { id: true, bookingId: true },
      });

      if (invoice.bookingId) {
        await trx.booking.update({
          where: { id: invoice.bookingId },
          data: { status: "CANCELLED" },
        });
      }

      return invoice;
    });
  }
}
