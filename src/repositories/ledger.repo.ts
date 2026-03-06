import { LedgerDirection, LedgerReferenceType, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class LedgerRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createEntry(
    data: {
      accountId: string;
      type: LedgerDirection;
      amount: number;
      referenceType?: LedgerReferenceType;
      referenceId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.ledgerEntry.create({ data });
  }

  async createMany(
    entries: {
      accountId: string;
      type: LedgerDirection;
      amount: number;
      referenceType?: LedgerReferenceType;
      referenceId?: string;
    }[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.ledgerEntry.createMany({
      data: entries,
    });
  }

  async getAccountHistory(
    accountId: string,
    cursor?: string,
    limit = 20,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);

    return client.ledgerEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }

  async findLedgerByAccount(
    accountId: string,
    cursor?: string,
    limit = 20,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);

    return client.ledgerEntry.findMany({
      where: {
        accountId: accountId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }

  async getBalance(accountId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);

    const credit = await client.ledgerEntry.aggregate({
      where: {
        accountId,
        type: "CREDIT",
      },
      _sum: { amount: true },
    });

    const debit = await client.ledgerEntry.aggregate({
      where: {
        accountId,
        type: "DEBIT",
      },
      _sum: { amount: true },
    });

    return Number(credit._sum.amount || 0) - Number(debit._sum.amount || 0);
  }
}
