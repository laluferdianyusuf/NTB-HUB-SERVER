import { Booking, BookingStatus, Prisma, PrismaClient } from "@prisma/client";

type FindBookingByVenueParams = {
  venueId: string;
  tab?: string;
  search?: string;
  page?: number;
  limit?: number;
};

const prisma = new PrismaClient();
export const bookingInclude = {
  user: {
    select: {
      name: true,
      address: true,
      email: true,
      photo: true,
    },
  },
  venue: {
    select: { name: true, id: true },
  },
  service: {
    select: {
      subCategory: {
        select: { id: true, name: true },
      },
    },
  },
  unit: {
    select: {
      name: true,
      price: true,
      type: true,
      floor: {
        select: { id: true, name: true },
      },
    },
  },
  orders: {
    select: {
      items: {
        select: {
          quantity: true,
          subtotal: true,
          menu: true,
        },
      },
    },
  },
  review: true,
} as const;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

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

  async getTotalSpendingPerUser(params?: {
    limit?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { limit, page = 1, pageSize = 10 } = params || {};

    return prisma.booking.groupBy({
      by: ["userId"],
      _sum: {
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
      ...(limit
        ? { take: limit }
        : {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
    });
  }

  async getBookingStatsByUsers(venueId: string, userIds: string[]) {
    return prisma.booking.groupBy({
      by: ["userId"],
      where: {
        venueId,
        userId: { in: userIds },
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    });
  }

  async getTopVenuePerUser(userIds: string[]) {
    return prisma.booking.groupBy({
      by: ["userId", "venueId"],
      _sum: {
        totalPrice: true,
      },
      where: {
        userId: { in: userIds },
      },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
    });
  }

  async findCompletedBookingsByVenue(venueId: string, fromDate: Date) {
    return prisma.booking.findMany({
      where: {
        venueId,
        createdAt: {
          gte: fromDate,
        },
        OR: [{ status: "COMPLETED" }, { status: "PAID" }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findBookingById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return await client.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  }

  async getBookingsByVenue(venueId: string) {
    return prisma.booking.findMany({
      where: { venueId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });
  }

  async findBookingByUserId(params?: {
    userId: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<BookingWithRelations[]> {
    const { userId, search, limit = 8, cursor } = params || {};

    const where: any = {
      userId: userId,
      ...(search && {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            venue: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            unit: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    return prisma.booking.findMany({
      where,
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: bookingInclude,
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async getUsersByVenue(venueId: string, search?: string) {
    return prisma.user.findMany({
      where: {
        bookings: {
          some: {
            venueId,
          },
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });
  }

  async findBookingByVenueId(params: FindBookingByVenueParams): Promise<{
    data: BookingWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      venueId,
      tab = "all_book",
      search = "",
      page = 1,
      limit = 10,
    } = params;

    const now = new Date();

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const andConditions: Prisma.BookingWhereInput[] = [];

    switch (tab) {
      case "today":
        andConditions.push({
          startTime: {
            gte: startToday,
            lte: endToday,
          },
        });
        break;

      case "pending":
        andConditions.push({
          status: "PENDING",
        });
        break;

      case "confirmed":
        andConditions.push({
          status: "PAID",
          startTime: {
            gt: now,
          },
        });
        break;

      case "live":
        andConditions.push({
          status: "PAID",
          startTime: { lte: now },
          endTime: { gte: now },
        });
        break;

      case "completed":
        andConditions.push({
          OR: [
            { status: "COMPLETED" },
            {
              status: "PAID",
              endTime: { lt: now },
            },
          ],
        });
        break;

      case "issues":
        andConditions.push({
          status: {
            in: ["CANCELLED", "EXPIRED"],
          },
        });
        break;
    }

    if (search.trim()) {
      andConditions.push({
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            unit: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            service: {
              subCategory: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.BookingWhereInput = {
      venueId,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: {
          startTime: "asc",
        },
        skip,
        take: limit,
      }),

      prisma.booking.count({
        where,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBookingPaidByUserId(
    userId: string,
  ): Promise<BookingWithRelations[]> {
    return await prisma.booking.findMany({
      where: {
        userId,
        status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
      include: bookingInclude,
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async getVenueDashboard(venueId: string) {
    const now = new Date();

    const [
      groupedStatus,
      todayRevenue,
      pendingBookings,
      ongoingBookings,
      latestCompleted,
    ] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        where: { venueId },
        _count: {
          status: true,
        },
      }),

      prisma.booking.aggregate({
        where: {
          venueId,
          status: {
            in: [BookingStatus.PAID, BookingStatus.COMPLETED],
          },
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),

      prisma.booking.findMany({
        where: {
          venueId,
          status: BookingStatus.PENDING,
        },
        include: bookingInclude,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.booking.findMany({
        where: {
          venueId,
          status: BookingStatus.ONGOING,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: bookingInclude,
        orderBy: {
          startTime: "asc",
        },
        take: 5,
      }),

      prisma.booking.findMany({
        where: {
          venueId,
          status: BookingStatus.COMPLETED,
        },
        include: bookingInclude,
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
    ]);

    const summary = {
      pending: 0,
      paid: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      expired: 0,
    };

    for (const row of groupedStatus) {
      summary[row.status.toLowerCase() as keyof typeof summary] =
        row._count.status;
    }

    return {
      summary,
      revenueToday: Number(todayRevenue._sum.totalPrice ?? 0),

      pending: pendingBookings,
      ongoing: ongoingBookings,
      latestCompleted,
    };
  }

  async findBookingCompleteByUserId(
    userId: string,
  ): Promise<BookingWithRelations[]> {
    return await prisma.booking.findMany({
      where: {
        userId,
        status: { in: [BookingStatus.COMPLETED] },
      },
      include: bookingInclude,
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async findBookingPendingByUserId(
    userId: string,
  ): Promise<BookingWithRelations[]> {
    return await prisma.booking.findMany({
      where: { userId, status: { in: [BookingStatus.PENDING] } },
      include: bookingInclude,
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

  async createBooking(
    data: {
      userId: string;
      venueId: string;
      serviceId: string;
      unitId: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    return await client.booking.create({
      data: data,
    });
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Booking> {
    const client = this.transaction(tx);
    return await client.booking.update({ where: { id }, data: { status } });
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
