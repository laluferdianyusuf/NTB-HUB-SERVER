import { Job } from "bullmq";
import { publisher } from "config/redis.config";
import { InvoiceRepository } from "../repositories";
import { addDelayedJob, cancelJob, createWorker } from "./index";

const invoiceRepository = new InvoiceRepository();
const QUEUE_NAME = "invoice-expiry";
const JOB_NAME = "expire-invoice";

interface InvoiceExpiryJobData {
  invoiceId: string;
}

createWorker(QUEUE_NAME, async (job: Job<InvoiceExpiryJobData>) => {
  const invoice = await invoiceRepository.findById(job.data.invoiceId);
  if (!invoice) return;

  if (invoice.status !== "PAID") {
    const expired = await invoiceRepository.markExpired(invoice.id);

    publisher.publish(
      "booking-events",
      JSON.stringify({
        event: "booking:expired",
        payload: {
          bookingId: invoice.id,
          expired,
          userId: expired.entityId,
        },
      }),
    );

    console.log(`[QUEUE] Invoice ${invoice.id} expired`);
  }
});

export async function enqueueInvoiceExpiry(invoiceId: string, expiredAt: Date) {
  const delay = expiredAt.getTime() - Date.now();
  await addDelayedJob(QUEUE_NAME, JOB_NAME, { invoiceId }, delay, invoiceId);
}
export async function cancelInvoiceExpiry(invoiceId: string) {
  await cancelJob(QUEUE_NAME, invoiceId);
}
