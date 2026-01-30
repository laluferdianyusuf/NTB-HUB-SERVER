import {
  Prisma,
  PrismaClient,
  Transaction,
  TransactionStatus,
} from "@prisma/client";
const prisma = new PrismaClient();

export class TransactionRepository {
  async create(
    data: Prisma.TransactionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const db = tx ?? prisma;
    return db.transaction.create({ data });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const db = tx ?? prisma;
    return db.transaction.findUnique({ where: { id } });
  }

  async findByOrderId(
    eventOrderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const db = tx ?? prisma;
    return db.transaction.findFirst({ where: { eventOrderId } });
  }

  async findByUserId(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const where = { userId };
    const queryOptions: any = {
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    };

    if (cursor) {
      queryOptions.skip = 1;
      queryOptions.cursor = { id: cursor };
    }

    const transactions = await prisma.transaction.findMany(queryOptions);
    return transactions;
  }

  async findByVenueId(venueId: string): Promise<Transaction[] | null> {
    return prisma.transaction.findMany({
      where: { venueId: venueId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAll(): Promise<Transaction[]> {
    return prisma.transaction.findMany();
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const db = tx ?? prisma;
    return db.transaction.update({
      where: { id },
      data: { status: status as TransactionStatus },
    });
  }

  async processSuccessfulTransaction(transaction: any) {
    return prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "SUCCESS" },
      });

      const existingBalance = await tx.userBalance.findUnique({
        where: { userId: transaction.userId },
      });

      const notification = await tx.notification.create({
        data: {
          userId: transaction.userId,
          title: "TOP UP Balance",
          message: "Top up balance successful",
          type: "Payment",
          isGlobal: false,
        },
      });

      let balances = null;
      if (existingBalance) {
        balances = await tx.userBalance.update({
          where: { userId: transaction.userId },
          data: {
            balance: { increment: transaction.amount },
          },
        });
      } else {
        balances = await tx.userBalance.create({
          data: {
            userId: transaction.userId,
            balance: transaction.amount,
          },
        });
      }

      const points = await tx.point.create({
        data: {
          userId: transaction.userId,
          points: Math.floor(transaction.amount / 1000),
          activity: "TOPUP",
          reference: transaction.id,
        },
      });

      const logs = await tx.log.create({
        data: {
          userId: transaction.userId,
          action: "TOPUP_SUCCESS",
          description: `User successfully topped up Rp${transaction.amount.toLocaleString()} via ${
            transaction.bankCode?.toUpperCase() || "unknown bank"
          }`,
        },
      });

      return { transactions, balances, points, logs, notification };
    });
  }

  async processFailedTransaction(transaction: any) {
    return prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
  }

  async updateTransaction(
    id: string,
    data: Partial<Transaction>,
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  }

  async findExpiredPendingTransactions(now: Date) {
    return await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        expiredAt: { lt: now },
      },
    });
  }

  async markTransactionExpired(id: string) {
    return await prisma.transaction.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
  }
}
