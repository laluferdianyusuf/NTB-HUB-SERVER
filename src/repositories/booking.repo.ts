import { PrismaClient, Booking, BookingStatus, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class BookingRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async findAllBooking() {
    return await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
      select: {
        userId: true,
        venueId: true,
        totalPrice: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findBookingById(id: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
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
    });
  }

  async findBookingByUserId(userId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        review: {
          select: {
            rating: true,
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
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findBookingByVenueId(venueId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { venueId },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        review: {
          select: {
            rating: true,
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
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findBookingPaidByUserId(userId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: {
        userId,
        status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        review: {
          select: {
            rating: true,
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
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findBookingPendingByUserId(userId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { userId, status: { in: [BookingStatus.PENDING] } },
      include: {
        venue: {
          select: {
            name: true,
          },
        },
        review: {
          select: {
            rating: true,
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
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
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
      }
    });

    console.log(
      `[AUTO-RESET] ${expiredBookings.length} booking expired has been completed.`,
    );

    return expiredBookings.length;
  }

  async existingBooking(
    serviceId: string,
    unitId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: {
        serviceId,
        unitId,
        status: { in: [BookingStatus.PENDING, BookingStatus.PAID] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  }

  async checkOverlapping({
    serviceId,
    unitId,
    startTime,
    endTime,
  }: {
    serviceId: string;
    unitId?: string | null;
    startTime: Date;
    endTime: Date;
  }) {
    const count = await prisma.booking.count({
      where: {
        serviceId,
        unitId,
        status: { notIn: ["CANCELLED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    return count > 0;
  }

  async createBooking({
    data,
    tx,
  }: {
    data: {
      userId: string;
      venueId: string;
      serviceId: string;
      unitId: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
    };
    tx?: Prisma.TransactionClient;
  }) {
    const client = this.transaction(tx);
    return await client.booking.create({
      data: data,
    });
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
  ): Promise<Booking> {
    return await prisma.booking.update({ where: { id }, data: { status } });
  }

  async processBookingPayment(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const updatedBooking = await db.booking.update({
      where: { id: id },
      data: { status: BookingStatus.PAID },
    });

    return updatedBooking;
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
    tx?: Prisma.TransactionClient,
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
    tx: Prisma.TransactionClient,
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
