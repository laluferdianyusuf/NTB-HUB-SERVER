import { Prisma, WithdrawStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export class WithdrawRepository {
  private db(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  create(
    data: {
      venueId: string;
      withdrawNumber: string;
      amount: number;
      fee: number;
      netAmount: number;
      bankCode: string;
      bankAccount: string;
      accountName: string;
      note?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.db(tx);
    return client.withdrawRequest.create({ data });
  }

  findById(id: string) {
    return prisma.withdrawRequest.findUnique({ where: { id } });
  }

  async getWithdrawals(venueId: string) {
    return prisma.withdrawRequest.findMany({
      where: { venueId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getWithdrawalsByDate(venueId: string, fromDate: Date) {
    return prisma.withdrawRequest.findMany({
      where: {
        venueId,
        createdAt: {
          gte: fromDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getWithdrawalsPaginated(venueId: string, skip = 0, take = 20) {
    const where = { venueId };

    const [data, total] = await prisma.$transaction([
      prisma.withdrawRequest.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.withdrawRequest.count({
        where,
      }),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  async findByVenue(venueId: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.withdrawRequest.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAll(
    params?: {
      status?: WithdrawStatus;
      skip?: number;
      take?: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.withdrawRequest.findMany({
      where: {
        ...(params?.status && { status: params.status }),
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: params?.skip ?? 0,
      take: params?.take ?? 20,
    });
  }

  async count(status?: WithdrawStatus, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.withdrawRequest.count({
      where: {
        ...(status && { status }),
      },
    });
  }

  updateStatus(
    id: string,
    status: WithdrawStatus,
    dateField?: "approvedAt" | "paidAt" | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.db(tx);
    return client.withdrawRequest.update({
      where: { id },
      data: {
        status,
        ...(dateField ? { [dateField]: new Date() } : {}),
      },
    });
  }
}
