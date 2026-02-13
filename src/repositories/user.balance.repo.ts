import { PrismaClient, UserBalance, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export class UserBalanceRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async getBalanceByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = this.transaction(tx);

    const userBalance = await client.userBalance.findUnique({
      where: { userId },
    });
    return userBalance ? userBalance.balance : null;
  }

  async updateBalance(
    userId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await prisma.userBalance.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }

  async decrementBalance(
    userId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.userBalance.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });
  }

  async createBalance(
    data: UserBalance,
    tx?: Prisma.TransactionClient,
  ): Promise<UserBalance> {
    const client = this.transaction(tx);
    return await client.userBalance.upsert({
      where: { userId: data.userId },
      update: { balance: data.balance },
      create: data,
    });
  }

  async generateInitialBalance(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.userBalance.create({
      data: {
        userId,
        balance: 0,
      },
    });
  }
}
