import { PrismaClient, Transaction, TransactionStatus } from "@prisma/client";
const prisma = new PrismaClient();

export class TransactionRepository {
  async create(data: Transaction): Promise<Transaction> {
    return prisma.transaction.create({ data });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<Transaction> {
    return prisma.transaction.findFirst({ where: { orderId } });
  }

  async findAll(): Promise<Transaction[]> {
    return prisma.transaction.findMany();
  }

  async updateStatus(id: string, status: string): Promise<Transaction> {
    return prisma.transaction.update({
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

      await tx.notification.create({
        data: {
          userId: transaction.userId,
          title: "TOP UP Balance",
          message: "Top up balance successful",
        },
      });

      if (existingBalance) {
        await tx.userBalance.update({
          where: { userId: transaction.userId },
          data: {
            balance: { increment: transaction.amount },
          },
        });
      } else {
        await tx.userBalance.create({
          data: {
            userId: transaction.userId,
            balance: transaction.amount,
          },
        });
      }

      await tx.point.create({
        data: {
          userId: transaction.userId,
          points: Math.floor(transaction.amount / 1000),
          activity: "TOPUP",
          reference: transaction.id,
        },
      });

      await tx.log.create({
        data: {
          userId: transaction.userId,
          action: "TOPUP_SUCCESS",
          description: `User successfully topped up Rp${transaction.amount.toLocaleString()} via ${
            transaction.bankCode?.toUpperCase() || "unknown bank"
          }`,
        },
      });

      return transactions;
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
    data: Partial<Transaction>
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  }
}
