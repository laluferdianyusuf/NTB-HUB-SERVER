import { Prisma } from "@prisma/client";
import { midtrans } from "config/midtrans.config";
import { prisma } from "config/prisma";
import crypto from "crypto";
import { enqueuePaymentWebhook } from "queue/paymentQueue";
import { enqueueTransactionExpiry } from "queue/transactionQueue";
import {
  AccountRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  UserRepository,
} from "../repositories";

const userRepository = new UserRepository();
const paymentRepository = new PaymentRepository();
const invoiceRepository = new InvoiceRepository();
const ledgerRepository = new LedgerRepository();
const accountRepository = new AccountRepository();

export class PaymentServices {
  private async createTopupLedger(
    userId: string,
    amount: number,
    invoiceId: string,
    tx: Prisma.TransactionClient,
  ) {
    const userAccount = await accountRepository.findUserAccount(userId);

    const platformAccount = await accountRepository.findPlatformAccount();

    if (!userAccount || !platformAccount) {
      throw new Error("Account not found");
    }

    await ledgerRepository.createMany(
      [
        {
          accountId: userAccount.id,
          type: "DEBIT",
          amount,
          referenceType: "TOPUP",
          referenceId: invoiceId,
        },
      ],
      tx,
    );
  }

  async TopUp(data: { userId: string; amount: number; bankCode: string }) {
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const adminFee = 4440;
    const grossAmount = data.amount + adminFee;

    const topUpId = `TOPUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const parameter = {
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: topUpId,
          gross_amount: grossAmount,
        },
        bank_transfer: {
          bank: data.bankCode.toLowerCase(),
        },
        custom_expiry: {
          expiry_duration: 5,
          unit: "minute",
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
      };

      const charge = await midtrans.charge(parameter);
      const vaNumber =
        charge.va_numbers?.[0]?.va_number ||
        charge.permata_va_number ||
        charge.bill_key ||
        null;

      if (!vaNumber) {
        throw new Error("Failed to generate VA");
      }

      const invoice = await invoiceRepository.create(
        {
          entityType: "TOPUP",
          entityId: data.userId,
          amount: Number(grossAmount),
          invoiceNumber: topUpId,
          expiredAt: expiredAt,
        },
        tx,
      );

      const payment = await paymentRepository.create(
        {
          invoiceId: invoice.id,
          amount: grossAmount,
          method: "VA",
          provider: "MIDTRANS",
          providerRef: invoice.invoiceNumber,
          vaNumber: vaNumber,
          bankCode: data.bankCode,
          expiredAt: expiredAt,
        },
        tx,
      );

      await enqueueTransactionExpiry(payment.id, payment.expiredAt as Date);

      return {
        id: invoice.id,
        amount: data.amount,
        grossAmount,
        vaNumber: vaNumber,
        bankCode: data.bankCode,
        expiredAt: invoice.expiredAt,
      };
    });
  }

  async TopUpQris(data: { userId: string; amount: number }) {
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const fee = Math.ceil(data.amount * 0.007);
    const grossAmount = data.amount + fee;

    const topUpId = `TOPUP-QRIS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const parameter = {
        payment_type: "qris",
        transaction_details: {
          order_id: topUpId,
          gross_amount: grossAmount,
        },
        qris: {
          acquirer: "gopay",
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
        custom_expiry: {
          expiry_duration: 5,
          unit: "minute",
        },
      };
      const charge = await midtrans.charge(parameter);
      const qrUrl =
        charge.actions?.find((a: any) => a.name === "generate-qr-code")?.url ||
        null;

      if (!qrUrl) {
        throw new Error("Failed to generate VA");
      }

      const invoice = await invoiceRepository.create(
        {
          entityType: "TOPUP",
          entityId: data.userId,
          amount: Number(grossAmount),
          invoiceNumber: topUpId,
          expiredAt: expiredAt,
        },
        tx,
      );

      const payment = await paymentRepository.create(
        {
          invoiceId: invoice.id,
          amount: grossAmount,
          method: "QRIS",
          provider: "MIDTRANS",
          providerRef: invoice.invoiceNumber,
          qrisUrl: qrUrl,
          expiredAt: expiredAt,
        },
        tx,
      );

      await enqueueTransactionExpiry(payment.id, payment.expiredAt as Date);

      return {
        id: invoice.id,
        amount: data.amount,
        grossAmount,
        qrisUrl: qrUrl,
        expiredAt: invoice.expiredAt,
      };
    });
  }

  async midtransCallback(payload: any) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const grossAmount = payload.gross_amount;

    const hash = crypto
      .createHash("sha512")
      .update(payload.order_id + payload.status_code + grossAmount + serverKey)
      .digest("hex");

    if (hash !== payload.signature_key) {
      throw new Error("Invalid signature");
    }

    await enqueuePaymentWebhook(payload);

    return {
      message: "Webhook received",
    };
  }

  async findAllPaymentsByUserId(
    id: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const payments = await paymentRepository.findByUserId(id, cursor, limit);
    const nextCursor =
      payments.length === limit ? payments[payments.length - 1].id : null;

    return {
      data: payments,
      nextCursor,
    };
  }
}
