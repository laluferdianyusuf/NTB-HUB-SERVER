import { addDelayedJob, createWorker, cancelJob } from "./index";
import { TransactionRepository } from "../repositories";
import { publisher } from "config/redis.config";
import { Job } from "bullmq";

const transactionRepository = new TransactionRepository();
const QUEUE_NAME = "invoice-expiry";
const JOB_NAME = "expire-invoice";

interface TransactionQueueJobData {
  transactionId: string;
}

createWorker(QUEUE_NAME, async (job: Job<TransactionQueueJobData>) => {
  const transaction = await transactionRepository.findById(
    job.data.transactionId,
  );
  if (!transaction) return;

  if (transaction.status !== "SUCCESS") {
    const trans = await transactionRepository.markTransactionExpired(
      transaction.id,
    );

    publisher.publish(
      "transactions-events",
      JSON.stringify({
        event: "transaction:expired",
        payload: {
          transactionId: trans.id,
          trans,
          userId: trans.userId,
        },
      }),
    );

    console.log(`[QUEUE] Transaction ${trans.amount} expired`);
  }
});

export async function enqueueTransactionExpiry(
  transactionId: string,
  expiredAt: Date,
) {
  const delay = expiredAt.getTime() - Date.now();
  await addDelayedJob(
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
