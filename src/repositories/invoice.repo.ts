import { PrismaClient, Invoice, Prisma, InvoiceStatus } from "@prisma/client";
import { Server } from "socket.io";
const prisma = new PrismaClient();

export class InvoiceRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async findAll(): Promise<Invoice[]> {
    return prisma.invoice.findMany({
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
            service: {
              select: {
                subCategory: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            unit: {
              select: {
                name: true,
                price: true,
                type: true,
                floor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            orderItems: {
              select: {
                quantity: true,
                subtotal: true,
                menu: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
            review: {
              select: {
                rating: true,
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
            service: {
              select: {
                subCategory: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            unit: {
              select: {
                name: true,
                price: true,
                type: true,
                floor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            orderItems: {
              select: {
                quantity: true,
                subtotal: true,
                menu: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
            review: {
              select: {
                rating: true,
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
                transactions: true,
                name: true,
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

  async findAllPaidByVenueId(venueId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        booking: {
          venueId,
        },
        status: InvoiceStatus.PAID,
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
                transactions: true,
                name: true,
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
            endTime: true,
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
            service: {
              select: {
                subCategory: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            unit: {
              select: {
                name: true,
                price: true,
                type: true,
                floor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            orderItems: {
              select: {
                quantity: true,
                subtotal: true,
                menu: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async create(
    data: Prisma.InvoiceUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Invoice> {
    const client = this.transaction(tx);
    return client.invoice.create({ data });
  }

  async updateInvoiceByEventOrderId(
    eventOrderId: string,
    status: InvoiceStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    return client.invoice.update({
      where: { eventOrderId },
      data: {
        status: status,
        paidAt: new Date(),
      },
    });
  }

  async updateInvoicePaid(bookingId: string, tx?: Prisma.TransactionClient) {
    const client = this.transaction(tx);
    return client.invoice.update({
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
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    return client.invoice.update({
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
    tx: Prisma.TransactionClient,
  ) {
    return tx.invoice.update({
      where: { bookingId },
      data: { amount: { increment: totalIncrease } },
    });
  }

  async findExpiredInvoices(now: Date, tx?: PrismaClient) {
    const client = this.transaction(tx);

    return client.invoice.findMany({
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
    const client = this.transaction(tx);

    return prisma.$transaction(async (trx) => {
      const invoice = await trx.invoice.update({
        where: { id: invoiceId },
        data: { status: "EXPIRED" },
        select: {
          id: true,
          booking: {
            include: {
              user: {
                select: {
                  id: true,
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
              service: {
                select: {
                  subCategory: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              unit: {
                select: {
                  name: true,
                  price: true,
                  type: true,
                  floor: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              orderItems: {
                select: {
                  quantity: true,
                  subtotal: true,
                  menu: {
                    select: {
                      name: true,
                      price: true,
                    },
                  },
                },
              },
              invoice: {
                select: {
                  amount: true,
                  paidAt: true,
                  cancelledAt: true,
                  expiredAt: true,
                  issuedAt: true,
                  invoiceNumber: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (invoice.booking?.id) {
        await trx.booking.update({
          where: { id: invoice.booking.id },
          data: { status: "CANCELLED" },
        });
      }

      return invoice;
    });
  }
}
