import { PrismaClient, UserBalance, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export class UserBalanceRepository {
  async getBalanceByUserId(userId: string): Promise<number | null> {
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId },
    });
    return userBalance ? userBalance.balance : null;
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    await prisma.userBalance.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }

  async decrementBalance(
    userId: string,
    amount: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    await tx.userBalance.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });
  }

  async createBalance(data: UserBalance): Promise<UserBalance> {
    return prisma.userBalance.upsert({
      where: { userId: data.userId },
      update: { balance: data.balance },
      create: data,
    });
  }

  async generateInitialBalance(
    userId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    await tx.userBalance.create({
      data: {
        userId,
        balance: 0,
      },
    });
  }
}
