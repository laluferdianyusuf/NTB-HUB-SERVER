import { createWorker, addDelayedJob, cancelJob } from "./index";
import { BookingRepository, NotificationRepository } from "../repositories";
import { NotificationService } from "../services/notification.services";
import { Job } from "bullmq";
import { Notification } from "@prisma/client";

const QUEUE_NAME = "booking-reminder";
const bookingRepository = new BookingRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();

interface BookingReminderJobData {
  bookingId: string;
  userId: string;
  type: "start" | "end";
}

// Worker
createWorker<BookingReminderJobData>(
  QUEUE_NAME,
  async (job: Job<BookingReminderJobData>) => {
    const { bookingId, userId, type } = job.data;

    const booking = await bookingRepository.findBookingById(bookingId);
    if (!booking) return;

    let title = "Booking Reminder";
    let message = "";

    if (type === "start") {
      message = `Booking kamu akan segera dimulai pada ${booking.startTime.toLocaleTimeString()}`;
    } else if (type === "end") {
      message = `Booking kamu akan segera selesai pada ${booking.endTime.toLocaleTimeString()}`;
    }

    await notificationRepository.createNewNotification({
      userId,
      title,
      message,
      type: "Booking",
      isGlobal: false,
    } as Notification);

    await notificationService.sendToUser(
      booking.venueId,
      userId,
      title,
      message,
      null,
    );
  },
);

export async function enqueueBookingReminders(
  bookingId: string,
  userId: string,
  startTime: Date,
  endTime: Date,
) {
  const delayStart = startTime.getTime() - Date.now() - 15 * 60 * 1000;
  const delayEnd = endTime.getTime() - Date.now() - 5 * 60 * 1000;

  if (delayStart > 0) {
    await addDelayedJob(
      QUEUE_NAME,
      `start-${bookingId}`,
      { bookingId, userId, type: "start" },
      delayStart,
      `start-${bookingId}`,
    );
  } else {
    await notificationService.sendToUser(
      bookingId,
      userId,
      "Booking Reminder",
      `Booking kamu akan segera dimulai pada ${startTime.toLocaleTimeString()}`,
      null,
    );
  }

  if (delayEnd > 0) {
    await addDelayedJob(
      QUEUE_NAME,
      `end-${bookingId}`,
      { bookingId, userId, type: "end" },
      delayEnd,
      `end-${bookingId}`,
    );
  } else {
    await notificationService.sendToUser(
      bookingId,
      userId,
      "Booking Reminder",
      `Booking kamu akan segera selesai pada ${endTime.toLocaleTimeString()}`,
      null,
    );
  }
}

export async function cancelBookingReminders(bookingId: string) {
  await cancelJob(QUEUE_NAME, `start-${bookingId}`);
  await cancelJob(QUEUE_NAME, `end-${bookingId}`);
}
