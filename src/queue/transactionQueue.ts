import { Job } from "bullmq";
import { publisher } from "config/redis.config";
import { PaymentRepository } from "../repositories";
import { addDelayedJob, cancelJob, createWorker } from "./index";

const paymentRepository = new PaymentRepository();
const QUEUE_NAME = "invoice-expiry";
const JOB_NAME = "expire-invoice";

interface TransactionQueueJobData {
  transactionId: string;
}

createWorker<TransactionQueueJobData>(
  QUEUE_NAME,
  async (job: Job<TransactionQueueJobData>) => {
    const { transactionId } = job.data;

    console.log(`[QUEUE] Running expiry job for ${transactionId}`);

    const transaction = await paymentRepository.findById(transactionId);

    if (!transaction) return;

    if (transaction.status !== "SUCCESS") {
      const expired = await paymentRepository.markExpired(transaction.id);

      await publisher.publish(
        "transactions-events",
        JSON.stringify({
          event: "transaction:expired",
          payload: {
            transactionId: expired.id,
            amount: expired.amount,
          },
        }),
      );

      console.log(`[QUEUE] Transaction ${expired.id} expired`);
    }
  },
);

export async function enqueueTransactionExpiry(
  transactionId: string,
  expiredAt: Date,
) {
  const delay = expiredAt.getTime() - Date.now();

  if (delay <= 0) return;

  await addDelayedJob<TransactionQueueJobData>(
    QUEUE_NAME,
    JOB_NAME,
    { transactionId },
    delay,
    transactionId,
  );
}

export async function cancelInvoiceExpiry(transactionId: string) {
  await cancelJob(QUEUE_NAME, transactionId);
}
