import {
  Notification,
  OrderItem,
  PointActivityType,
  PrismaClient,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import {
  BookingRepository,
  UserBalanceRepository,
  InvoiceRepository,
  TransactionRepository,
  NotificationRepository,
  PointsRepository,
  VenueBalanceRepository,
  VenueServiceRepository,
  VenueUnitRepository,
  OperationalRepository,
} from "../repositories";
import { publisher } from "config/redis.config";
import { error, success } from "helpers/return";
import { toLocalDBTime } from "helpers/formatIsoDate";
import { NotificationService } from "./notification.services";
import {
  PLATFORM_BALANCE_ID,
  PLATFORM_FEE_NUMBER,
} from "config/finance.config";
import { cancelInvoiceExpiry, enqueueInvoiceExpiry } from "queue/invoiceQueue";
import {
  cancelBookingReminders,
  enqueueBookingReminders,
} from "queue/bookingReminderQueue";
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const invoiceRepository = new InvoiceRepository();
const transactionRepository = new TransactionRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();
const pointRepository = new PointsRepository();
const venueServiceRepository = new VenueServiceRepository();
const venueUnitRepository = new VenueUnitRepository();
const operationalRepository = new OperationalRepository();
const prisma = new PrismaClient();

interface CreateBookingProps {
  userId: string;
  venueId: string;
  serviceId: string;
  unitId: string;
  startTime: number;
  endTime: number;
  orders?: OrderItem[];
  sessionId?: string;
  date?: string;
}

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class BookingServices {
  async createBooking(data: CreateBookingProps) {
    try {
      const service = await venueServiceRepository.findById(data.serviceId);
      if (!service || !service.isActive) {
        return error.error400("Service not available");
      }

      const unit = await venueUnitRepository.findById(data.unitId);
      if (!unit || !unit.isActive) {
        return error.error400("Unit not available");
      }

      const startTime = new Date(
        `${data.date}T${String(data.startTime).padStart(2, "0")}:00:00`,
      );
      const endTime = new Date(
        `${data.date}T${String(data.endTime).padStart(2, "0")}:00:00`,
      );

      if (endTime <= startTime) {
        return error.error400("Invalid booking time range");
      }

      const dayOfWeek = startTime.getDay();

      const operational = await operationalRepository.getOperationalHourOfWeek(
        data.venueId,
        dayOfWeek,
      );

      if (!operational) {
        return error.error400("Venue closed");
      }

      if (
        data.startTime < operational.opensAt ||
        data.endTime > operational.closesAt
      ) {
        return error.error400("Outside operational hours");
      }

      const overlapping = await bookingRepository.checkOverlapping({
        serviceId: data.serviceId,
        unitId: data.unitId,
        startTime,
        endTime,
      });

      if (overlapping) {
        return error.error400("Time slot already booked");
      }

      const hours = data.endTime - data.startTime;
      const totalPrice = hours * unit.price;

      const invoiceNumber = `INV-${crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            userId: data.userId,
            venueId: data.venueId,
            serviceId: data.serviceId,
            unitId: data.unitId,
            startTime,
            endTime,
            totalPrice,
          },
        });

        let orderAmount = 0;

        if (data.orders?.length) {
          for (const o of data.orders) {
            const menu = await tx.menu.findUnique({
              where: { id: o.menuId },
            });
            if (!menu) throw new Error("Menu not found");

            const subtotal = menu.price * o.quantity;
            orderAmount += subtotal;

            await tx.orderItem.create({
              data: {
                bookingId: booking.id,
                menuId: o.menuId,
                quantity: o.quantity,
                subtotal,
              },
            });
          }
        }

        const invoice = await tx.invoice.create({
          data: {
            bookingId: booking.id,
            invoiceNumber,
            amount: totalPrice + orderAmount,
            expiredAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        await enqueueInvoiceExpiry(invoice.id, invoice.expiredAt);

        return { booking, invoice };
      });

      await notificationService.sendToVenue(
        data.venueId,
        `New Booking Is Pending`,
        `Booking with ${invoiceNumber} is created`,
        null,
      );

      const pendingBookings =
        await bookingRepository.findBookingPendingByUserId(
          result.booking.userId,
        );

      await publishEvent("booking-events", "booking:pending", {
        userId: result.booking.userId,
        data: pendingBookings ?? [],
      });

      await publishEvent("invoice-events", "invoice:created", result.invoice);

      return success.success201("Booking created", result);
    } catch (err) {
      console.error(err);
      return error.error500("Internal server error");
    }
  }

  async updateBookingPayment(id: string) {
    try {
      const invoice = await invoiceRepository.findByBookingId(id);
      if (!invoice) {
        return error.error404("Invoice not found");
      }

      const booking = await bookingRepository.findBookingById(id);
      if (!booking) {
        return error.error404("Book not found");
      }

      if (invoice.status === "PAID") {
        return error.error400("This book is already paid");
      }

      if (invoice.expiredAt && invoice.expiredAt < new Date()) {
        return error.error400("Invoice expired");
      }

      const userBalance = await userBalanceRepository.getBalanceByUserId(
        booking.userId,
      );

      const platformFee = Number(PLATFORM_FEE_NUMBER);
      const venueAmount = invoice.amount - platformFee;

      if (venueAmount < 0) {
        return error.error400("Invoice amount must be greater than fee");
      }

      if (!userBalance || userBalance < invoice.amount) {
        return error.error400("Insufficient balance");
      }
      const result = await prisma.$transaction(async (tx) => {
        const processedBooking = await bookingRepository.processBookingPayment(
          booking.id,
          tx,
        );

        const paymentId = `PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

        const platformFee = Number(PLATFORM_FEE_NUMBER);
        const venueAmount = invoice.amount - platformFee;

        if (venueAmount < 0)
          throw new Error("Invoice amount must be greater than fee");

        await transactionRepository.create({
          userId: booking.userId,
          amount: invoice.amount,
          type: TransactionType.DEDUCTION,
          status: TransactionStatus.SUCCESS,
          reference: booking.id,
          orderId: paymentId,
        });

        await transactionRepository.create({
          venueId: booking.venueId,
          amount: venueAmount,
          type: TransactionType.DEDUCTION,
          status: TransactionStatus.SUCCESS,
          reference: booking.id,
          orderId: paymentId,
        });

        await transactionRepository.create({
          venueId: booking.venueId,
          amount: platformFee,
          type: TransactionType.FEE,
          status: TransactionStatus.SUCCESS,
          reference: booking.id,
          orderId: `${paymentId}-FEE`,
        });

        const points = await pointRepository.generatePoints(
          {
            userId: booking.userId,
            activity: PointActivityType.BOOKING,
            points: 10,
            reference: booking.id,
          },
          tx,
        );

        await userBalanceRepository.decrementBalance(
          booking.userId,
          invoice.amount,
          tx,
        );
        await venueBalanceRepository.incrementVenueBalance(
          booking.venueId,
          venueAmount,
        );

        await tx.platformBalance.update({
          where: { id: PLATFORM_BALANCE_ID },
          data: { balance: { increment: platformFee } },
        });

        const updatedInvoice = await invoiceRepository.updateInvoicePaid(
          booking.id,
          tx,
        );

        await cancelInvoiceExpiry(updatedInvoice.id);

        const userNotification =
          await notificationRepository.createNewNotification({
            userId: booking.userId,
            title: "Payment Successful",
            message: `Your payment of ${invoice.amount} for booking ${invoice.invoiceNumber} has been successfully received. Thank you!`,
            type: "Booking",
            isGlobal: false,
          } as Notification);

        const venueBookingNotification =
          await notificationRepository.createNewNotification({
            venueId: booking.venueId,
            title: "Booking Paid",
            message: `Booking ${invoice.invoiceNumber} has been paid. Total received: ${venueAmount}`,
            type: "Booking",
            isGlobal: false,
          } as Notification);

        const venueFeeNotification =
          await notificationRepository.createNewNotification({
            venueId: booking.venueId,
            title: "Platform Fee Collected",
            message: `A platform fee of ${platformFee} has been collected from booking ${invoice.invoiceNumber}.`,
            type: "Payment",
            isGlobal: false,
          } as Notification);

        return {
          booking: processedBooking,
          points,
          invoice: updatedInvoice,
          userNotification,
          venueBookingNotification,
          venueFeeNotification,
        };
      });

      await notificationService.sendToUser(
        booking.venueId,
        booking.userId,
        result.userNotification.title,
        result.userNotification.message,
        null,
      );

      await notificationService.sendToVenue(
        booking.venueId,
        result.venueBookingNotification.title,
        result.venueBookingNotification.message,
        null,
      );

      await notificationService.sendToVenue(
        booking.venueId,
        result.venueFeeNotification.title,
        result.venueFeeNotification.message,
        null,
      );

      await enqueueBookingReminders(
        booking.id,
        booking.userId,
        booking.startTime,
        booking.endTime,
      );
      const pendingBookings =
        await bookingRepository.findBookingPendingByUserId(booking.userId);

      const paidBookings = await bookingRepository.findBookingPaidByUserId(
        booking.userId,
      );

      await publishEvent("booking-events", "booking:pending", {
        userId: booking.userId,
        data: pendingBookings ?? [],
      });

      await publishEvent("booking-events", "booking:paid", {
        userId: booking.userId,
        data: paidBookings ?? [],
      });

      await publishEvent("points-events", "point:updated", result.points);
      await publishEvent("invoice-events", "invoice:updated", result.invoice);
      await publishEvent(
        "notification-events",
        "notification:send",
        result.userNotification,
      );

      return success.success200("Booking payment processed", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  async getAllBookings() {
    try {
      await bookingRepository.resetExpiredBookings();
      const booking = await bookingRepository.findAllBooking();
      return success.success200("Book retrieved", booking);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  async getBookingById(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return error.error404("Book not found");
      }

      return success.success200("Book retrieved", booking);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  async getBookingByUserId(userId: string) {
    const booking = await bookingRepository.findBookingByUserId(userId);

    if (!booking) {
      throw new Error("booking not found");
    }

    return booking;
  }

  async getBookingByVenueId(venueId: string) {
    const booking = await bookingRepository.findBookingByVenueId(venueId);

    if (!booking) {
      throw new Error("booking not found");
    }

    return booking;
  }

  async getBookingPaidByUserId(userId: string) {
    const booking = await bookingRepository.findBookingPaidByUserId(userId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async getBookingPendingByUserId(userId: string) {
    const booking = await bookingRepository.findBookingPendingByUserId(userId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async cancelBooking(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        const bookings = await bookingRepository.cancelBooking(id, tx);

        const invoice = await invoiceRepository.updateInvoiceCanceled(id, tx);

        return { bookings, invoice };
      });

      const pendingBookings =
        await bookingRepository.findBookingPendingByUserId(booking.userId);

      await publishEvent("booking-events", "booking:pending", {
        userId: booking.userId,
        data: pendingBookings ?? [],
      });

      await cancelBookingReminders(booking.id);

      return {
        status: true,
        status_code: 200,
        message: "Booking canceled",
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async completeBooking(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const updated = await bookingRepository.completeBooking(id);

      const paidBookings = await bookingRepository.findBookingPaidByUserId(
        booking.userId,
      );

      await publishEvent("booking-events", "booking:paid", {
        userId: booking.userId,
        data: paidBookings ?? [],
      });

      return {
        status: true,
        status_code: 200,
        message: "Booking completed",
        data: updated,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getExistingBooking(
    serviceId: string,
    unitId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const startTimeDB = toLocalDBTime(new Date(startTime));
    const endTimeDB = toLocalDBTime(new Date(endTime));

    try {
      const existing = await bookingRepository.existingBooking(
        serviceId,
        unitId,
        startTimeDB,
        endTimeDB,
      );

      return success.success200("Booking fetch successfully", existing);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
