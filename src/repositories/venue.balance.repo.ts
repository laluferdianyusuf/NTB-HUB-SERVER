import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class VenueBalanceRepository {
  async getBalanceByUserId(venueId: string): Promise<number | null> {
    const venueBalance = await prisma.venueBalance.findUnique({
      where: { venueId },
    });
    return venueBalance ? venueBalance.balance : null;
  }

  async incrementVenueBalance(venueId: string, amount: number): Promise<void> {
    await prisma.venueBalance.upsert({
      where: { venueId },
      update: { balance: { increment: amount } },
      create: { venueId, balance: amount },
    });
  }

  async decrementVenueBalance(venueId: string, amount: number): Promise<void> {
    await prisma.venueBalance.upsert({
      where: { venueId },
      update: { balance: { decrement: amount } },
      create: { venueId, balance: 0 },
    });
  }

  async ensureInitialBalance(venueId: string): Promise<void> {
    await prisma.venueBalance.upsert({
      where: { venueId },
      update: {},
      create: {
        venueId,
        balance: 0,
      },
    });
  }
}
