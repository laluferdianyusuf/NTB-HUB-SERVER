import {
  PrismaClient,
  WithdrawStatus,
  TransactionStatus,
  TransactionType,
  Notification,
} from "@prisma/client";
import { PLATFORM_BALANCE_ID } from "config/finance.config";
import { error, success } from "helpers/return";
import { NotificationRepository, WithdrawRepository } from "repositories";
import { NotificationService } from "./notification.services";

export class WithdrawService {
  private prisma = new PrismaClient();
  private withdrawRepo = new WithdrawRepository(this.prisma);
  private notificationServices = new NotificationService();
  private notificationRepository = new NotificationRepository();

  // #region venue
  async requestWithdraw(
    venueId: string,
    payload: {
      amount: number;
      fee: number;
      bankCode: string;
      bankAccount: string;
      accountName: string;
      note?: string;
    }
  ) {
    try {
      const venueBalance = await this.prisma.venueBalance.findUnique({
        where: { venueId },
      });

      if (!venueBalance || venueBalance.balance < payload.amount) {
        return error.error400("Insufficient venue balance");
      }

      const result = await this.withdrawRepo.create({
        venueId,
        amount: payload.amount,
        fee: payload.fee,
        netAmount: payload.amount - payload.fee,
        bankCode: payload.bankCode,
        bankAccount: payload.bankAccount,
        accountName: payload.accountName,
        note: payload.note,
      });

      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      await Promise.all(
        admins.map((admin) =>
          this.notificationRepository.createNewNotification({
            userId: admin.id,
            title: "Withdraw Request",
            message: `Venue requested for withdraw IDR ${payload.amount}`,
            type: "Withdraw",
            adminOnly: true,
            isGlobal: false,
          } as Notification)
        )
      );

      await this.notificationServices.sendToAdmin(
        "Withdraw Request",
        `New withdraw request IDR ${payload.amount}`
      );

      return success.success201("Withdraw request send to admin", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  // #region venue
  async approveWithdraw(id: string) {
    try {
      const withdraw = await this.withdrawRepo.findById(id);
      if (!withdraw || withdraw.status !== WithdrawStatus.PENDING) {
        return error.error400("Withdraw not valid for approval");
      }

      const result = await this.withdrawRepo.updateStatus(
        id,
        WithdrawStatus.APPROVED,
        "approvedAt"
      );

      await this.notificationRepository.createNewNotification({
        venueId: withdraw.venueId,
        title: "Withdraw Approved",
        message: `Your withdraw IDR ${withdraw.amount} has been approved`,
        type: "Withdraw",
        adminOnly: false,
        isGlobal: false,
      } as Notification);

      await this.notificationServices.sendToVenue(
        withdraw.venueId,
        "Withdraw Approved",
        `Your withdraw IDR ${withdraw.amount} has been approved`
      );

      return success.success200("Withdraw Approved", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  // #region admin
  async markAsPaid(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const withdraw = await this.withdrawRepo.findById(id);
        if (!withdraw || withdraw.status !== WithdrawStatus.APPROVED) {
          return error.error400("Withdraw not approved");
        }
        await tx.venueBalance.update({
          where: { venueId: withdraw.venueId },
          data: {
            balance: { decrement: withdraw.amount },
          },
        });

        if (withdraw.fee > 0) {
          await tx.platformBalance.update({
            where: { id: PLATFORM_BALANCE_ID },
            data: {
              balance: { increment: withdraw.fee },
            },
          });
        }

        await tx.transaction.create({
          data: {
            venueId: withdraw.venueId,
            amount: withdraw.amount,
            type: TransactionType.DEDUCTION,
            status: TransactionStatus.SUCCESS,
            reference: withdraw.id,
          },
        });

        if (withdraw.fee > 0) {
          await tx.transaction.create({
            data: {
              amount: withdraw.fee,
              type: TransactionType.FEE,
              status: TransactionStatus.SUCCESS,
              reference: withdraw.id,
            },
          });
        }

        return tx.withdrawRequest.update({
          where: { id },
          data: {
            status: WithdrawStatus.PAID,
            paidAt: new Date(),
          },
        });
      });

      return success.success200("Withdraw Paid", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  // #region admin
  async rejectWithdraw(id: string) {
    try {
      const withdraw = await this.withdrawRepo.findById(id);
      if (!withdraw || withdraw.status !== WithdrawStatus.PENDING) {
        return error.error400("Withdraw not valid for rejection");
      }

      const result = await this.withdrawRepo.updateStatus(
        id,
        WithdrawStatus.REJECTED
      );

      await this.notificationRepository.createNewNotification({
        venueId: withdraw.venueId,
        title: "Withdraw Rejected",
        message: `Your withdraw IDR ${withdraw.amount} has been rejected`,
        type: "Withdraw",
        adminOnly: false,
        isGlobal: false,
      } as Notification);

      await this.notificationServices.sendToVenue(
        withdraw.venueId,
        "Withdraw Rejected",
        `Your withdraw IDR ${withdraw.amount} has been rejected`
      );

      return success.success200("Withdraw Rejected", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  // #region admin
  async getVenueWithdraws(venueId: string) {
    try {
      const result = await this.withdrawRepo.findByVenue(venueId);

      return success.success200("Withdraw Retrieved", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  // #region admin
  async getAllWithdraws() {
    try {
      const result = await this.withdrawRepo.findAll();

      return success.success200("Withdraw Retrieved", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
