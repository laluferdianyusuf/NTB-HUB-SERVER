import {
  Account,
  NotificationRecipientType,
  Prisma,
  Role,
  WithdrawRequest,
  WithdrawStatus,
} from "@prisma/client";
import { prisma } from "config/prisma";

import {
  AccountRepository,
  ActivityLogRepository,
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
  private activityLogRepo = new ActivityLogRepository();

  private validateTransition(current: WithdrawStatus, next: WithdrawStatus) {
    const allowed = VALID_TRANSITIONS[current] || [];

    if (!allowed.includes(next)) {
      throw new Error(`Invalid status transition from ${current} → ${next}`);
    }
  }

  private async validateAccountAccess(userId: string, account: any) {
    if (account.userId === userId) return true;

    if (account.venueId) {
      return this.roleRepo.hasRole({
        userId,
        venueId: account.venueId,
        role: Role.VENUE_OWNER,
      });
    }

    if (account.eventId) {
      return this.roleRepo.hasRole({
        userId,
        eventId: account.eventId,
        role: Role.EVENT_OWNER,
      });
    }

    if (account.communityId) {
      return this.roleRepo.hasRole({
        userId,
        communityId: account.communityId,
        role: Role.COMMUNITY_OWNER,
      });
    }

    if (account.courierId) {
      return account.userId === userId;
    }

    return false;
  }

  private async resolveRecipient(account: Account): Promise<{
    recipientType: NotificationRecipientType;
    recipientId: string;
  }> {
    if (account.userId) {
      return { recipientType: "USER", recipientId: account.userId };
    }

    if (account.venueId) {
      return { recipientType: "VENUE", recipientId: account.venueId };
    }

    if (account.eventId) {
      return { recipientType: "EVENT", recipientId: account.eventId };
    }

    if (account.communityId) {
      return { recipientType: "COMMUNITY", recipientId: account.communityId };
    }

    if (account.courierId) {
      return { recipientType: "COURIER", recipientId: account.courierId };
    }

    throw new Error("Invalid account owner");
  }

  async resolveAccountOwner(account: Account) {
    if (account.venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: account.venueId },
        select: { name: true },
      });

      return { name: venue?.name, type: "VENUE" };
    }

    if (account.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: account.eventId },
        select: { name: true },
      });

      return { name: event?.name, type: "EVENT" };
    }

    if (account.communityId) {
      const community = await prisma.community.findUnique({
        where: { id: account.communityId },
        select: { name: true },
      });

      return { name: community?.name, type: "COMMUNITY" };
    }

    if (account.courierId) {
      return { name: "Courier", type: "COURIER" };
    }

    if (account.userId) {
      const user = await prisma.user.findUnique({
        where: { id: account.userId },
        select: { name: true },
      });

      return { name: user?.name, type: "USER" };
    }

    return { name: "Unknown", type: "UNKNOWN" };
  }

  private async notifyWithdraw(
    tx: Prisma.TransactionClient,
    account: Account,
    withdraw: WithdrawRequest,
    title: string,
    message: string,
  ) {
    const recipient = await this.resolveRecipient(account);

    await this.notificationRepo.create(
      {
        ...recipient,
        title,
        message,
        type: "WITHDRAW",
        entityId: withdraw.id,
      },
      tx,
    );
  }

  async requestWithdraw(
    currentUserId: string,
    accountId: string,
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

    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new Error("Account not found");

    const hasAccess = await this.validateAccountAccess(currentUserId, account);
    if (!hasAccess) throw new Error("Unauthorized");

    const owner = await this.resolveAccountOwner(account);

    const withdrawNumber = `WD-${Date.now()}-${Math.floor(
      Math.random() * 1000,
    )}`;

    const netAmount = payload.amount - PLATFORM_WITHDRAW_FEE;

    const balance = await this.ledgerRepository.getBalance(account.id);

    if (Number(balance.totalBalance) < payload.amount) {
      throw new Error("Insufficient balance");
    }

    return prisma.$transaction(async (tx) => {
      const withdraw = await this.withdrawRepo.create(
        {
          account: { connect: { id: accountId } },
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

      await this.activityLogRepo.create(
        {
          actorId: currentUserId,
          actorType: "USER",
          entityType: "WITHDRAW",
          entityId: withdraw.id,
          action: "CREATE",
          metadata: {
            amount: payload.amount,
          },
        },
        tx,
      );

      const admins = await this.roleRepo.findAdmins();
      await this.notificationRepo.createMany(
        admins.map((admin) => ({
          recipientType: "ADMIN",
          recipientId: admin.user.id,
          title: "Withdraw Request",
          message: "Ada withdraw baru",
          type: "WITHDRAW",
          entityId: withdraw.id,
          adminOnly: true,
        })),
        tx,
      );

      await this.notificationService.sendToAdmins(
        "Withdraw Request",
        `${owner.type} ${owner.name} requested withdraw IDR ${payload.amount}`,
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

      const account = await this.accountRepository.findById(
        withdraw.accountId,
        tx,
      );
      if (!account) throw new Error("Account not found");

      await this.activityLogRepo.create(
        {
          actorId: adminId,
          actorType: "ADMIN",
          entityType: "WITHDRAW",
          entityId: withdraw.id,
          action: "APPROVE",
        },
        tx,
      );

      const result = await this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
        tx,
      );

      await this.notifyWithdraw(
        tx,
        account,
        withdraw,
        "Withdraw Approved",
        `Withdraw ${withdraw.withdrawNumber} telah disetujui`,
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

      await this.activityLogRepo.create(
        {
          actorId: adminId,
          actorType: "ADMIN",
          entityType: "WITHDRAW",
          entityId: withdraw.id,
          action: "PAID",
        },
        tx,
      );

      if (!proofUrl) {
        throw new Error("Proof is required");
      }

      const account = await this.accountRepository.findById(
        withdraw.accountId,
        tx,
      );

      if (!account) throw new Error("Account not found");

      const platformAccount =
        await this.accountRepository.findPlatformAccount(tx);

      if (!platformAccount) throw new Error("Platform account not found");

      const balance = await this.ledgerRepository.getBalance(account.id, tx);

      if (Number(balance.totalBalance) < Number(withdraw.amount)) {
        throw new Error("Insufficient balance");
      }

      await this.ledgerRepository.createMany(
        [
          {
            accountId: account.id,
            type: "DEBIT",
            amount: Number(withdraw.amount),
            referenceType: "WITHDRAWAL",
            referenceId: withdraw.id,
          },
          {
            accountId: platformAccount.id,
            type: "CREDIT",
            amount: Number(withdraw.fee),
            referenceType: "FEE",
            referenceId: withdraw.id,
          },
        ],
        tx,
      );

      await this.notifyWithdraw(
        tx,
        account,
        withdraw,
        "Withdraw Paid",
        `Withdraw ${withdraw.withdrawNumber} telah dibayar`,
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

      const account = await this.accountRepository.findById(
        withdraw.accountId,
        tx,
      );
      if (!account) throw new Error("Account not found");

      await this.activityLogRepo.create(
        {
          actorId: adminId,
          actorType: "ADMIN",
          entityType: "WITHDRAW",
          entityId: withdraw.id,
          action: "REJECT",
          metadata: { reason },
        },
        tx,
      );

      await this.withdrawRepo.update(
        id,
        {
          status: WithdrawStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: adminId,
          failureReason: reason,
        },
        tx,
      );

      await this.notifyWithdraw(
        tx,
        account,
        withdraw,
        "Withdraw Approved",
        `Withdraw ${withdraw.withdrawNumber} ditolak. Alasan: ${reason}`,
      );
    });
  }

  async getAllWithdraws(params?: {
    status?: WithdrawStatus;
    page?: number;
    limit?: number;
  }) {
    const result = await this.withdrawRepo.listByAccount({
      status: params?.status,
      page: params?.page,
      limit: params?.limit,
    });

    return {
      ...result,
      data: result.data.map((w) => ({
        id: w.id,
        withdrawNumber: w.withdrawNumber,

        amount: w.amount,
        fee: w.fee,
        netAmount: w.netAmount,

        status: w.status,

        accountId: w.accountId,

        entityName:
          w.account.venue?.name ||
          w.account.event?.name ||
          w.account.community?.name ||
          w.account.user?.name ||
          "Unknown",

        entityType: w.account.type,

        bankAccount: w.bankAccount,
        accountName: w.accountName,

        requestedAt: w.requestedAt,
        approvedAt: w.approvedAt,
        paidAt: w.paidAt,
      })),
    };
  }

  async getWithdrawsByAccount(
    accountId: string,
    currentUserId: string,
    params?: {
      status?: WithdrawStatus;
      page?: number;
      limit?: number;
    },
  ) {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new Error("Account not found");

    const hasAccess = await this.validateAccountAccess(currentUserId, account);

    if (!hasAccess) throw new Error("Unauthorized");

    const result = await this.withdrawRepo.listByAccount({
      accountId,
      status: params?.status,
      page: params?.page,
      limit: params?.limit,
    });

    return {
      ...result,
      data: result.data.map((w) => ({
        id: w.id,
        withdrawNumber: w.withdrawNumber,

        amount: w.amount,
        fee: w.fee,
        netAmount: w.netAmount,

        status: w.status,

        bankAccount: w.bankAccount,
        accountName: w.accountName,

        requestedAt: w.requestedAt,
        approvedAt: w.approvedAt,
        paidAt: w.paidAt,
        failureReason: w.failureReason,
      })),
    };
  }

  async getWithdrawsByVenue(venueId: string) {
    return this.withdrawRepo.listByVenue(venueId);
  }
}
