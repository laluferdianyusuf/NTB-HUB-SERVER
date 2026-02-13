import { Prisma, PrismaClient, WithdrawStatus } from "@prisma/client";

export class WithdrawRepository {
  constructor(private prisma = new PrismaClient()) {}

  private db(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  create(data: {
    venueId: string;
    withdrawNumber: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankCode: string;
    bankAccount: string;
    accountName: string;
    note?: string;
  }) {
    return this.prisma.withdrawRequest.create({ data });
  }

  findById(id: string) {
    return this.prisma.withdrawRequest.findUnique({ where: { id } });
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
    dateField?: "approvedAt" | "paidAt",
  ) {
    return this.prisma.withdrawRequest.update({
      where: { id },
      data: {
        status,
        ...(dateField ? { [dateField]: new Date() } : {}),
      },
    });
  }
}
