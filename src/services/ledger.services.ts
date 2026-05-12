import { LedgerReferenceType } from "@prisma/client";
import { prisma } from "config/prisma";
import {
  AccountRepository,
  LedgerRepository,
  UserRepository,
} from "repositories";

const transactionLabels: Record<string, string> = {
  TOPUP: "Top Up",
  BOOKING_PAYMENT: "Booking",
  EVENT_PAYMENT: "Event",
  COMMUNITY_EVENT_PAYMENT: "Community Event",
  REFUND: "Refund",
  WITHDRAWAL: "Withdrawal",
  SETTLEMENT: "Settlement",
  FEE: "Fee",
  ADJUSTMENT: "Adjustment",
  ORDER: "Order",
};

export class LedgerServices {
  constructor(
    private ledgerRepository: LedgerRepository,
    private userRepository: UserRepository,
    private accountRepository: AccountRepository,
  ) {}

  async findHistory(accountId: string, limit: number = 20, cursor?: string) {
    return prisma.$transaction(async (tx) => {
      const transactions = await this.ledgerRepository.findLedgerByAccount(
        accountId,
        cursor,
        limit,
        tx,
      );

      const userIds = [...new Set(transactions.map((t) => t.accountId))];

      const users = await this.userRepository.findByIds(userIds, tx);

      const result = transactions.map((trx) => ({
        ...trx,
        user: users.find((u) => u.id === trx.accountId),
      }));

      return result;
    });
  }

  async getBalances(accountId: string) {
    return this.ledgerRepository.getBalance(accountId);
  }

  async getAllTransactions(
    page = 1,
    limit = 20,
    type?: string,
    mode?: "USER_TRANSACTION" | "APP_REVENUE",
  ) {
    const skip = (page - 1) * limit;

    return this.ledgerRepository.getAllTransactions(skip, limit, type, mode);
  }

  async getBalanceByOwner(params: {
    userId?: string;
    venueId?: string;
    courierId?: string;
    eventId?: string;
    communityEventId?: string;
  }) {
    return this.ledgerRepository.getBalanceByOwner(params);
  }

  async getUserTransactions(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      referenceType?: LedgerReferenceType;
    },
  ) {
    const result = await this.ledgerRepository.findUserTransactions(
      userId,
      params,
    );

    const grouped = result.data.reduce(
      (acc, transaction) => {
        const key = transaction.referenceType || "OTHER";

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(transaction);

        return acc;
      },
      {} as Record<string, typeof result.data>,
    );

    const sections = Object.entries(grouped).map(([type, data]) => ({
      type,
      label: transactionLabels[type] || type,
      totalTransactions: data.length,
      data,
    }));

    return {
      sections,
      meta: result.meta,
    };
  }

  async getEventTransactions(eventId: string, cursor?: string) {
    const account = await this.accountRepository.findEventAccount(eventId);

    if (!account) throw new Error("Account not found");

    return this.ledgerRepository.getAccountHistory(account.id, cursor);
  }

  async getCommunityEventTransactions(
    communityEventId: string,
    cursor?: string,
  ) {
    const account =
      await this.accountRepository.findCommunityEventAccount(communityEventId);

    if (!account) throw new Error("Account not found");

    return this.ledgerRepository.getAccountHistory(account.id, cursor);
  }

  async getCourierTransactions(courierId: string, cursor?: string) {
    const account = await this.accountRepository.findCourierAccount(courierId);

    if (!account) throw new Error("Account not found");

    return this.ledgerRepository.getAccountHistory(account.id, cursor);
  }

  async getVenueTransactions(venueId: string, cursor?: string) {
    const account = await this.accountRepository.findVenueAccount(venueId);

    if (!account) throw new Error("Account not found");

    return this.ledgerRepository.getAccountHistory(account.id, cursor);
  }
}
