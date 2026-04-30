import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class WithdrawRepository {
  async create(
    data: Prisma.WithdrawRequestCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;
    return db.withdrawRequest.create({ data });
  }

  async findById(id: string) {
    return prisma.withdrawRequest.findUnique({
      where: { id },
    });
  }

  async findByIdForUpdate(id: string, tx: Prisma.TransactionClient) {
    return tx.$queryRawUnsafe(
      `SELECT * FROM "WithdrawRequest" WHERE id = $1 FOR UPDATE`,
      id,
    );
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

  async getWithdrawalsPaginated(venueId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.withdrawRequest.findMany({
        where: { venueId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.withdrawRequest.count({
        where: { venueId },
      }),
    ]);

    return {
      data,
      total,
    };
  }

  async sumWithdrawalsByStatus(venueId: string, fromDate: Date) {
    return prisma.withdrawRequest.groupBy({
      by: ["status"],
      where: {
        venueId,
        createdAt: {
          gte: fromDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.WithdrawRequestUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? prisma;

    return db.withdrawRequest.update({
      where: { id },
      data,
    });
  }

  async listByVenue(venueId: string) {
    return prisma.withdrawRequest.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
    });
  }
}
