import { Notification, Role, WithdrawStatus } from "@prisma/client";
import { prisma } from "config/prisma";

import {
  AccountRepository,
  LedgerRepository,
  NotificationRepository,
  UserRoleRepository,
  WithdrawRepository,
} from "repositories";

import { NotificationService } from "./notification.services";

const PLATFORM_WITHDRAW_FEE = 2500;

const VALID_TRANSITIONS: Record<WithdrawStatus, WithdrawStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["PROCESSING"],
  PROCESSING: ["PAID", "FAILED"],
  PAID: [],
  REJECTED: [],
  FAILED: [],
};

export class WithdrawService {
  private withdrawRepo = new WithdrawRepository();
  private notificationRepo = new NotificationRepository();
  private roleRepo = new UserRoleRepository();
  private notificationService = new NotificationService();
  private accountRepository = new AccountRepository();
  private ledgerRepository = new LedgerRepository();

  private validateTransition(current: WithdrawStatus, next: WithdrawStatus) {
    const allowed = VALID_TRANSITIONS[current] || [];

    if (!allowed.includes(next)) {
      throw new Error(`Invalid status transition from ${current} → ${next}`);
    }
  }

  async requestWithdraw(
    currentUserId: string,
    venueId: string,
    payload: {
      amount: number;
      bankCode: string;
      bankAccount: string;
      accountName: string;
      note?: string;
    },
  ) {
    if (payload.amount <= PLATFORM_WITHDRAW_FEE) {
      throw new Error("Amount must be greater than withdraw fee");
    }

    const hasPermission =
      (await this.roleRepo.hasRole({
        userId: currentUserId,
        role: Role.VENUE_OWNER,
        venueId,
      })) ||
      (await this.roleRepo.hasRole({
        userId: currentUserId,
        role: Role.VENUE_STAFF,
        venueId,
      }));

    if (!hasPermission) {
      throw new Error("Unauthorized");
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) throw new Error("Venue not found");

    const withdrawNumber = `WD-${Date.now()}-${Math.floor(
      Math.random() * 1000,
    )}`;

    const netAmount = payload.amount - PLATFORM_WITHDRAW_FEE;

    return prisma.$transaction(async (tx) => {
      const withdraw = await this.withdrawRepo.create(
        {
          venue: { connect: { id: venueId } },
          withdrawNumber,
          amount: payload.amount,
          fee: PLATFORM_WITHDRAW_FEE,
          netAmount,
          bankCode: payload.bankCode,
          bankAccount: payload.bankAccount,
          accountName: payload.accountName,
          note: payload.note,
        },
        tx,
      );

      const admins = await this.roleRepo.findAdmins();

      await Promise.all(
        admins.map((admin) =>
          this.notificationRepo.createNewNotification(
            {
              userId: admin.user.id,
              title: "Withdraw Request",
              message: `Venue ${venue.name} requested withdraw IDR ${payload.amount}`,
              type: "Withdraw",
              adminOnly: true,
              isGlobal: false,
            } as Notification,
            tx,
          ),
        ),
      );

      await this.notificationService.sendToAdmins(
        "Withdraw Request",
        `Venue ${venue.name} requested withdraw IDR ${payload.amount}`,
      );

      return withdraw;
    });
  }

  async approveWithdraw(id: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const rows: any = await this.withdrawRepo.findByIdForUpdate(id, tx);

      if (!rows?.length) throw new Error("Withdraw not found");

      const withdraw = rows[0];

      this.validateTransition(withdraw.status, WithdrawStatus.APPROVED);

      const result = await this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
        tx,
      );

      return result;
    });
  }

  async markProcessing(id: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const rows: any = await this.withdrawRepo.findByIdForUpdate(id, tx);

      if (!rows?.length) throw new Error("Withdraw not found");

      const withdraw = rows[0];

      this.validateTransition(withdraw.status, WithdrawStatus.PROCESSING);

      return this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.PROCESSING,
        },
        tx,
      );
    });
  }

  async markAsPaid(id: string, adminId: string, proofUrl: string) {
    return prisma.$transaction(async (tx) => {
      const rows: any = await this.withdrawRepo.findByIdForUpdate(id, tx);

      if (!rows?.length) throw new Error("Withdraw not found");

      const withdraw = rows[0];

      this.validateTransition(withdraw.status, WithdrawStatus.PAID);

      if (!proofUrl) {
        throw new Error("Proof is required");
      }

      const venueAccount = await this.accountRepository.findVenueAccount(
        withdraw.venueId,
        tx,
      );

      const platformAccount =
        await this.accountRepository.findPlatformAccount(tx);

      if (!venueAccount || !platformAccount) {
        throw new Error("Account not found");
      }

      const balance = await this.ledgerRepository.getBalanceByOwner(
        { venueId: venueAccount.id },
        tx,
      );

      if (Number(balance.totalBalance) < Number(withdraw.amount)) {
        throw new Error("Insufficient balance");
      }

      await this.ledgerRepository.createMany(
        [
          {
            accountId: venueAccount.id,
            type: "DEBIT",
            amount: Number(withdraw.amount),
            referenceType: "WITHDRAWAL",
            referenceId: withdraw.id,
          },
          {
            accountId: platformAccount.id,
            type: "CREDIT",
            amount: PLATFORM_WITHDRAW_FEE,
            referenceType: "FEE",
            referenceId: withdraw.id,
          },
        ],
        tx,
      );

      return this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.PAID,
          paidAt: new Date(),
          paidBy: adminId,
          proofUrl,
        },
        tx,
      );
    });
  }

  async rejectWithdraw(id: string, adminId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const rows: any = await this.withdrawRepo.findByIdForUpdate(id, tx);

      if (!rows?.length) throw new Error("Withdraw not found");

      const withdraw = rows[0];

      this.validateTransition(withdraw.status, WithdrawStatus.REJECTED);

      return this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: adminId,
          failureReason: reason,
        },
        tx,
      );
    });
  }

  async getAllWithdraws(params?: {
    status?: WithdrawStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.withdrawRequest.findMany({
        where: { status: params?.status },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawRequest.count({
        where: { status: params?.status },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWithdrawsByVenue(venueId: string) {
    return this.withdrawRepo.listByVenue(venueId);
  }
}
