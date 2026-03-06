import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CommunityBalanceRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async getBalanceByCommunityId(
    communityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = this.transaction(tx);

    const communityBalance = await client.communityBalance.findUnique({
      where: { communityId },
    });
    return communityBalance ? Number(communityBalance.balance) : null;
  }

  async incrementBalance(
    communityId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.communityBalance.update({
      where: { communityId },
      data: { balance: { increment: amount } },
    });
  }

  async decrementBalance(
    communityId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.communityBalance.update({
      where: { communityId },
      data: { balance: { decrement: amount } },
    });
  }
}
