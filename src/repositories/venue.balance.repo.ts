import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class VenueBalanceRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async getBalanceByUserId(
    venueId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = this.transaction(tx);
    const venueBalance = await client.venueBalance.findUnique({
      where: { venueId },
    });
    return venueBalance ? venueBalance.balance : null;
  }

  async incrementVenueBalance(
    venueId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.venueBalance.upsert({
      where: { venueId },
      update: { balance: { increment: amount } },
      create: { venueId, balance: amount },
    });
  }

  async decrementVenueBalance(
    venueId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.venueBalance.upsert({
      where: { venueId },
      update: { balance: { decrement: amount } },
      create: { venueId, balance: 0 },
    });
  }

  async ensureInitialBalance(
    venueId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.venueBalance.upsert({
      where: { venueId },
      update: {},
      create: {
        venueId,
        balance: 0,
      },
    });
  }
}
