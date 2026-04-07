import {
  AccountType,
  LedgerDirection,
  LedgerReferenceType,
  Prisma,
} from "@prisma/client";
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

    const totalBalance = Number(credit._sum.amount || 0);
    const totalExpenses = Number(debit._sum.amount || 0);
    const balance = totalBalance - totalExpenses;

    return {
      balance,
      totalBalance,
      totalExpenses,
    };
  }

  async getBalanceByOwner(
    params: {
      userId?: string;
      venueId?: string;
      courierId?: string;
      eventId?: string;
      communityId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);

    const account = await client.account.findFirst({
      where: {
        OR: [
          { userId: params.userId },
          { venueId: params.venueId },
          { courierId: params.courierId },
          { eventId: params.eventId },
          { communityId: params.communityId },
        ],
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return this.getBalance(account.id, tx);
  }

  async getTopSpenders(limit = 10) {
    const result = await prisma.ledgerEntry.groupBy({
      by: ["accountId"],
      where: {
        type: LedgerDirection.DEBIT,
        account: {
          type: AccountType.USER,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: { amount: "desc" },
      },
      take: limit,
    });

    const accounts = await prisma.account.findMany({
      where: {
        id: { in: result.map((g) => g.accountId) },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
        ledgerEntries: {
          where: {
            type: LedgerDirection.DEBIT,
          },
          select: {
            referenceType: true,
          },
        },
      },
    });

    return result.map((g) => {
      const account = accounts.find((a) => a.id === g.accountId);
      const entries = account?.ledgerEntries ?? [];

      return {
        userId: account?.user?.id,
        name: account?.user?.name,
        totalTransactions: g._count.id,
        totalSpent: g._sum.amount ?? 0,
        orderMenu: entries.filter(
          (v) => v.referenceType === LedgerReferenceType.ORDER,
        ).length,
        bookingVenue: entries.filter(
          (v) => v.referenceType === LedgerReferenceType.BOOKING_PAYMENT,
        ).length,
        eventTicket: entries.filter(
          (v) => v.referenceType === LedgerReferenceType.EVENT_PAYMENT,
        ).length,
        communityEventTicket: entries.filter(
          (v) =>
            v.referenceType === LedgerReferenceType.COMMUNITY_EVENT_PAYMENT,
        ).length,
      };
    });
  }

  async getGMV() {
    const result = await prisma.ledgerEntry.aggregate({
      where: {
        type: LedgerDirection.DEBIT,
        account: {
          type: AccountType.USER,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? 0;
  }

  async getRevenueBreakdown() {
    const result = await prisma.ledgerEntry.groupBy({
      by: ["referenceType"],
      where: {
        type: LedgerDirection.DEBIT,
        account: {
          type: AccountType.USER,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return result;
  }

  async getDailyRevenue() {
    const transactions = await prisma.ledgerEntry.findMany({
      where: {
        type: LedgerDirection.DEBIT,
        account: {
          type: AccountType.USER,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const daily: Record<string, number> = {};

    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().split("T")[0];

      if (!daily[date]) {
        daily[date] = 0;
      }

      daily[date] += Number(t.amount);
    });

    return Object.entries(daily).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  async getActiveUsers() {
    const users = await prisma.ledgerEntry.groupBy({
      by: ["accountId"],
      where: {
        type: LedgerDirection.DEBIT,
        account: {
          type: AccountType.USER,
        },
      },
      _count: true,
    });

    return users.length;
  }
}
