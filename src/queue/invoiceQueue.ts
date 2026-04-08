import { Job } from "bullmq";
import { publisher } from "config/redis.config";
import { BookingServices } from "services";
import { BookingRepository, InvoiceRepository } from "../repositories";
import { addDelayedJob, cancelJob, createWorker } from "./index";

const invoiceRepository = new InvoiceRepository();
const bookingRepository = new BookingRepository();

let bookingService: BookingServices;

function getBookingService() {
  if (!bookingService) {
    bookingService = new BookingServices();
  }
  return bookingService;
}

const QUEUE_NAME = "invoice-expiry";
const JOB_NAME = "expire-invoice";

interface InvoiceExpiryJobData {
  invoiceId: string;
}

createWorker(QUEUE_NAME, async (job: Job<InvoiceExpiryJobData>) => {
  const bookingService = getBookingService();

  const invoice = await invoiceRepository.findById(job.data.invoiceId);
  if (!invoice) return;

  if (invoice.status !== "PAID") {
    const expired = await invoiceRepository.markExpired(invoice.id);

    const booking = await bookingRepository.findBookingById(expired.entityId);

    if (!booking) return;

    publisher.publish(
      "booking-events",
      JSON.stringify({
        event: "booking:sync",
        payload: {
          userId: booking.userId,
          bookings: await bookingService.getBookingByUserId({
            userId: booking.userId,
            status: "all_book",
          }),
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
