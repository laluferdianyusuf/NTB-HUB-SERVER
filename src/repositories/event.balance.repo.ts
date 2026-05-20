import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export class EventBalanceRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async getBalanceByEventId(
    eventId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = this.transaction(tx);

    const eventBalance = await client.eventBalance.findUnique({
      where: { eventId },
    });
    return eventBalance ? Number(eventBalance.balance) : null;
  }

  async incrementBalance(
    eventId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.eventBalance.update({
      where: { eventId },
      data: { balance: { increment: amount } },
    });
  }

  async decrementBalance(
    eventId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = this.transaction(tx);
    await client.eventBalance.update({
      where: { eventId },
      data: { balance: { decrement: amount } },
    });
  }
}
