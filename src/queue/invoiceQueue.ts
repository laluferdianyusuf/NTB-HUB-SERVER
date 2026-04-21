import { Job } from "bullmq";
import { publisher } from "config/redis.config";
import { InvoiceRepository } from "repositories";
import { BookingRepository } from "repositories/booking.repo";
import { BookingServices } from "services";
import { addDelayedJob, cancelJob, createWorker } from "./index";

const bookingRepository = new BookingRepository();
const invoiceRepository = new InvoiceRepository();

let bookingService: BookingServices;
function getBookingService() {
  if (!bookingService) bookingService = new BookingServices();
  return bookingService;
}

const START_QUEUE = "booking-start";
const COMPLETE_QUEUE = "booking-complete";

interface BookingJobData {
  bookingId: string;
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

    await bookingRepository.updateBookingStatus(booking.id, "EXPIRED");

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

createWorker(START_QUEUE, async (job: Job<BookingJobData>) => {
  console.log("[QUEUE] START booking:", job.data.bookingId);

  const booking = await bookingRepository.findBookingById(job.data.bookingId);
  if (!booking) return;

  if (booking.status !== "PAID") return;

  await bookingRepository.updateBookingStatus(booking.id, "ONGOING");

  const service = getBookingService();

  publisher.publish(
    "booking-events",
    JSON.stringify({
      event: "booking:sync",
      payload: {
        userId: booking.userId,
        bookings: await service.getBookingByUserId({
          userId: booking.userId,
          status: "all_book",
        }),
      },
    }),
  );

  console.log("[QUEUE] Booking → ONGOING");
});

createWorker(COMPLETE_QUEUE, async (job: Job<BookingJobData>) => {
  console.log("[QUEUE] COMPLETE booking:", job.data.bookingId);

  const booking = await bookingRepository.findBookingById(job.data.bookingId);
  if (!booking) return;

  if (booking.status !== "ONGOING") return;

  await bookingRepository.updateBookingStatus(booking.id, "COMPLETED");

  const service = getBookingService();

  publisher.publish(
    "booking-events",
    JSON.stringify({
      event: "booking:sync",
      payload: {
        userId: booking.userId,
        bookings: await service.getBookingByUserId({
          userId: booking.userId,
          status: "all_book",
        }),
      },
    }),
  );

  console.log("[QUEUE] Booking → COMPLETED");
});

export async function enqueueBookingStart(bookingId: string, startTime: Date) {
  const delay = Math.max(0, startTime.getTime() - Date.now());

  await addDelayedJob(
    START_QUEUE,
    "start-booking",
    { bookingId },
    delay,
    `start-${bookingId}`,
  );
}

export async function enqueueBookingComplete(bookingId: string, endTime: Date) {
  const delay = Math.max(0, endTime.getTime() - Date.now());

  await addDelayedJob(
    COMPLETE_QUEUE,
    "complete-booking",
    { bookingId },
    delay,
    `complete-${bookingId}`,
  );
}

export async function enqueueInvoiceExpiry(invoiceId: string, expiredAt: Date) {
  const delay = Math.max(0, expiredAt.getTime() - Date.now());

  await addDelayedJob(
    QUEUE_NAME,
    JOB_NAME,
    { invoiceId },
    delay,
    invoiceId, // jobId biar bisa cancel
  );
}

export async function cancelInvoiceExpiry(invoiceId: string) {
  await cancelJob(QUEUE_NAME, invoiceId);
}

export async function cancelBookingLifecycle(bookingId: string) {
  await cancelJob(START_QUEUE, `start-${bookingId}`);
  await cancelJob(COMPLETE_QUEUE, `complete-${bookingId}`);
}
