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
    await prisma.venueBalance.update({
      where: { venueId },
      data: { balance: { increment: amount } },
    });
  }

  async decrementVenueBalance(venueId: string, amount: number): Promise<void> {
    await prisma.venueBalance.update({
      where: { venueId },
      data: { balance: { decrement: amount } },
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
