import { Job } from "bullmq";
import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import { addJob, createWorker } from "./index";

import {
  AccountRepository,
  InvoiceRepository,
  LedgerRepository,
  PaymentRepository,
  PointsRepository,
  UserBalanceRepository,
} from "../repositories";

const paymentRepository = new PaymentRepository();
const invoiceRepository = new InvoiceRepository();
const ledgerRepository = new LedgerRepository();
const pointsRepository = new PointsRepository();
const balanceRepository = new UserBalanceRepository();
const accountRepository = new AccountRepository();

const QUEUE_NAME = "payment-processing";
const JOB_NAME = "process-midtrans-webhook";

interface PaymentWebhookJob {
  payload: any;
}

createWorker<PaymentWebhookJob>(
  QUEUE_NAME,
  async (job: Job<PaymentWebhookJob>) => {
    const payload = job.data.payload;

    console.log(`[QUEUE] Processing payment ${payload.order_id}`);

    await prisma.$transaction(async (tx) => {
      const payment = await paymentRepository.findByProviderRef(
        payload.order_id,
        tx,
      );

      if (!payment) {
        console.log("Payment not found");
        return;
      }

      if (payment.status === "SUCCESS") {
        console.log("Payment already processed");
        return;
      }

      const status = payload.transaction_status;
      if (["capture", "settlement"].includes(status)) {
        const settlement = await paymentRepository.markSuccess(payment.id, tx);

        await invoiceRepository.markPaid(payment.invoiceId, tx);

        const userId = payment.invoice.entityId;

        const userAccount = await accountRepository.findUserAccount(userId, tx);
        const platformAccount = await accountRepository.findPlatformAccount(tx);

        if (!userAccount || !platformAccount) {
          throw new Error("Account not found");
        }

        const actualAmount = Number(payment.amount) - 4440;

        await ledgerRepository.createMany(
          [
            {
              accountId: userAccount.id,
              type: "DEBIT",
              amount: actualAmount,
              referenceType: "TOPUP",
              referenceId: payment.invoiceId,
            },
            {
              accountId: platformAccount.id,
              type: "CREDIT",
              amount: 4440,
              referenceType: "TOPUP",
              referenceId: payment.invoiceId,
            },
          ],
          tx,
        );

        await balanceRepository.incrementBalance(userId, actualAmount, tx);

        await pointsRepository.generatePoints(
          {
            userId,
            points: 10,
            activity: "PAYMENT",
            reference: payment.id,
          },
          tx,
        );

        await publisher.publish(
          "transactions-events",
          JSON.stringify({
            event: "transaction:success",
            payload: settlement,
          }),
        );
      }

      if (status === "expire") {
        const expired = await paymentRepository.markExpired(payment.id, tx);

        await invoiceRepository.markExpired(payment.invoiceId, tx);

        await publisher.publish(
          "transactions-events",
          JSON.stringify({
            event: "transaction:expired",
            payload: expired,
          }),
        );

        console.log(`[QUEUE] Payment expired ${payment.id}`);
      }

      if (["cancel", "deny"].includes(status)) {
        const cancel = await paymentRepository.markFailed(payment.id, tx);

        await invoiceRepository.markFailed(payment.invoiceId, tx);

        await publisher.publish(
          "transactions-events",
          JSON.stringify({
            event: "transaction:failed",
            payload: cancel,
          }),
        );

        console.log(`[QUEUE] Payment failed ${payment.id}`);
      }
    });
  },
);

export async function enqueuePaymentWebhook(payload: any) {
  await addJob<PaymentWebhookJob>(QUEUE_NAME, JOB_NAME, { payload });
}
