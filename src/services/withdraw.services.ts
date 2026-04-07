import { Notification, Role, WithdrawStatus } from "@prisma/client";
import { prisma } from "config/prisma";
import crypto from "crypto";

import {
  AccountRepository,
  LedgerRepository,
  NotificationRepository,
  UserRoleRepository,
  WithdrawRepository,
} from "repositories";

import { NotificationService } from "./notification.services";

const PLATFORM_WITHDRAW_FEE = 2500;

export class WithdrawService {
  private withdrawRepo = new WithdrawRepository();
  private notificationRepo = new NotificationRepository();
  private roleRepo = new UserRoleRepository();
  private notificationService = new NotificationService();
  private accountRepository = new AccountRepository();
  private ledgerRepository = new LedgerRepository();

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
      throw new Error("You are not authorized to request withdraw");
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new Error("Venue not found");
    }

    const withdrawNumber = `WD-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const netAmount = payload.amount - PLATFORM_WITHDRAW_FEE;

    return prisma.$transaction(async (tx) => {
      const withdraw = await this.withdrawRepo.create(
        {
          venueId,
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

  async approveWithdraw(id: string) {
    const withdraw = await this.withdrawRepo.findById(id);

    if (!withdraw || withdraw.status !== WithdrawStatus.PENDING) {
      throw new Error("Withdraw not valid for approval");
    }

    return prisma.$transaction(async (tx) => {
      const result = await this.withdrawRepo.updateStatus(
        id,
        WithdrawStatus.APPROVED,
        "approvedAt",
        tx,
      );

      await this.notificationRepo.createNewNotification(
        {
          venueId: withdraw.venueId,
          title: "Withdraw Approved",
          message: `Your withdraw IDR ${withdraw.amount} has been approved`,
          type: "Withdraw",
          adminOnly: false,
          isGlobal: false,
        } as Notification,
        tx,
      );

      await this.notificationService.sendToVenueOwner(
        withdraw.venueId,
        "Withdraw Approved",
        `Your withdraw IDR ${withdraw.amount} has been approved`,
      );

      return result;
    });
  }

  async markAsPaid(id: string) {
    const withdraw = await this.withdrawRepo.findById(id);

    if (!withdraw) {
      throw new Error("Withdraw not found");
    }

    if (withdraw.status === WithdrawStatus.PAID) {
      throw new Error("Withdraw already paid");
    }

    if (withdraw.status !== WithdrawStatus.APPROVED) {
      throw new Error("Withdraw not approved");
    }

    const venueAccount = await this.accountRepository.findVenueAccount(
      withdraw.venueId,
    );

    const platformAccount = await this.accountRepository.findPlatformAccount();

    if (!venueAccount || !platformAccount) {
      throw new Error("Account not found");
    }

    const balance = await this.ledgerRepository.getBalanceByOwner({
      venueId: venueAccount.id,
    });

    if (Number(balance.totalBalance) < Number(withdraw.amount)) {
      throw new Error("Insufficient balance");
    }

    return prisma.$transaction(async (tx) => {
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

      return this.withdrawRepo.updateStatus(
        id,
        WithdrawStatus.PAID,
        "paidAt",
        tx,
      );
    });
  }

  async rejectWithdraw(id: string) {
    const withdraw = await this.withdrawRepo.findById(id);

    if (!withdraw || withdraw.status !== WithdrawStatus.PENDING) {
      throw new Error("Withdraw not valid for rejection");
    }

    return prisma.$transaction(async (tx) => {
      const result = await this.withdrawRepo.updateStatus(
        id,
        WithdrawStatus.REJECTED,
        null,
        tx,
      );

      await this.notificationRepo.createNewNotification(
        {
          venueId: withdraw.venueId,
          title: "Withdraw Rejected",
          message: `Your withdraw IDR ${withdraw.amount} has been rejected`,
          type: "Withdraw",
          adminOnly: false,
          isGlobal: false,
        } as Notification,
        tx,
      );

      await this.notificationService.sendToVenueOwner(
        withdraw.venueId,
        "Withdraw Rejected",
        `Your withdraw IDR ${withdraw.amount} has been rejected`,
      );

      return result;
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
      this.withdrawRepo.findAll({
        status: params?.status,
        skip,
        take: limit,
      }),
      this.withdrawRepo.count(params?.status),
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
    const result = await this.withdrawRepo.findByVenue(venueId);

    if (!result || result.length === 0) {
      throw new Error("No withdraws found");
    }

    return result;
  }
}
