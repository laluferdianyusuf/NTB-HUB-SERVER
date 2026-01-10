import {
  Booking,
  Notification,
  OrderItem,
  PointActivityType,
  PrismaClient,
  TableStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import {
  BookingRepository,
  UserBalanceRepository,
  TableRepository,
  InvoiceRepository,
  TransactionRepository,
  NotificationRepository,
  PointsRepository,
  VenueBalanceRepository,
} from "../repositories";
import { publisher } from "config/redis.config";
import { error, success } from "helpers/return";
import { normalizeDate, toLocalDBTime } from "helpers/formatIsoDate";
import { NotificationService } from "./notification.services";
import {
  PLATFORM_BALANCE_ID,
  PLATFORM_FEE_NUMBER,
  PLATFORM_FEE_PERCENT,
} from "config/finance.config";
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const tableRepository = new TableRepository();
const invoiceRepository = new InvoiceRepository();
const transactionRepository = new TransactionRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();
const pointRepository = new PointsRepository();
const prisma = new PrismaClient();

interface Props {
  userId: string;
  venueId: string;
  tableId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  orders: OrderItem[];
}

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class BookingServices {
  async createBooking(data: Props) {
    const startTime = normalizeDate(String(data.startTime));
    const endTime = normalizeDate(String(data.endTime));

    const invoiceNumber = `INV-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    try {
      const table = await tableRepository.findTablesById(data.tableId);

      if (!table) return error.error404("Table not found");
      if (table.status === "MAINTENANCE")
        return error.error400("This table is under maintenance");

      const overlapping = await bookingRepository.existingBooking(
        data.tableId,
        startTime,
        endTime
      );

      if (overlapping.length > 0) return error.error400("Booking exist");

      const result = await prisma.$transaction(async (tx) => {
        const booking = await bookingRepository.createBooking(
          {
            userId: data.userId,
            venueId: data.venueId,
            tableId: data.tableId,
            startTime: startTime,
            endTime: endTime,
            totalPrice: data.totalPrice,
          } as Booking,
          tx
        );

        let totalOrderAmount = 0;
        let orderItems: any[] = [];

        if (data.orders && data.orders.length > 0) {
          const menuIds = data.orders.map((o) => o.menuId);
          const menus = await tx.menu.findMany({
            where: { id: { in: menuIds } },
          });

          for (const o of data.orders) {
            const menu = menus.find((m) => m.id === o.menuId);
            if (!menu) throw new Error(`Menu not found: ${o.menuId}`);

            const subtotal = menu.price * o.quantity;
            totalOrderAmount += subtotal;

            orderItems.push(
              await tx.orderItem.create({
                data: {
                  bookingId: booking.id,
                  menuId: o.menuId,
                  quantity: o.quantity,
                  subtotal,
                },
              })
            );
          }
        }

        const totalInvoiceAmount = booking.totalPrice + totalOrderAmount;

        const invoice = await invoiceRepository.create(
          {
            bookingId: booking.id,
            invoiceNumber,
            amount: totalInvoiceAmount,
            paymentMethod: "DEDUCTION",
            expiredAt: new Date(Date.now() + 5 * 60 * 1000),
          },
          tx
        );

        return { booking, orderItems, invoice };
      });
      const fullInvoice = await invoiceRepository.findById(result.invoice.id);

      await notificationService.sendToUser(
        data.venueId,
        data.userId,
        "Booking Created",
        `Your booking has been created with invoice ${fullInvoice.invoiceNumber}`,
        null
      );

      await publishEvent("invoice-events", "invoice:created", fullInvoice);

      return success.success201("Booking created successfully", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
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
        booking.userId
      );

      const paymentId = `PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

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
          tx
        );

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
          tx
        );

        await userBalanceRepository.decrementBalance(
          booking.userId,
          invoice.amount,
          tx
        );

        await venueBalanceRepository.incrementVenueBalance(
          booking.venueId,
          venueAmount
        );

        await tx.platformBalance.update({
          where: { id: PLATFORM_BALANCE_ID },
          data: {
            balance: { increment: platformFee },
          },
        });

        const updatedInvoice = await invoiceRepository.updateInvoicePaid(
          booking.id,
          tx
        );

        const notification = await notificationRepository.createNewNotification(
          {
            userId: booking.userId,
            title: "Payment Successful",
            message: `Thank you! Your payment of ${invoice.amount} has been successfully received.`,
            type: "Booking",
            isGlobal: false,
          } as Notification
        );

        const venueNotification =
          await notificationRepository.createNewNotification({
            venueId: booking.venueId,
            title: "Payment Successful",
            message: `A payment of ${invoice.amount} has been received for invoice ${invoice.invoiceNumber}.`,
            type: "Booking",
            isGlobal: false,
          } as Notification);

        return {
          booking: processedBooking,
          points,
          invoice: updatedInvoice,
          notification,
          venueNotification,
        };
      });

      await notificationService.sendToUser(
        booking.venueId,
        booking.userId,
        result.notification.title,
        result.notification.message,
        null
      );

      await notificationService.sendToVenue(
        booking.venueId,
        result.venueNotification.title,
        result.venueNotification.message,
        null
      );

      await publishEvent("points-events", "point:updated", result.points);
      await publishEvent(
        "notification-events",
        "notification:send",
        result.notification
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
    try {
      const booking = await bookingRepository.findBookingByUserId(userId);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "booking not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Booking founded",
        data: booking,
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

        await tableRepository.updateTableStatus(
          booking.tableId,
          TableStatus.AVAILABLE,
          tx
        );

        return { bookings, invoice };
      });

      await publisher.publish(
        "booking-events",
        JSON.stringify({
          event: "booking:updated",
          payload: result.bookings,
        })
      );

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

  async getExistingBooking(tableId: string, startTime: Date, endTime: Date) {
    const startTimeDB = toLocalDBTime(new Date(startTime));
    const endTimeDB = toLocalDBTime(new Date(endTime));

    try {
      const existing = await bookingRepository.existingBooking(
        tableId,
        startTimeDB,
        endTimeDB
      );

      return success.success200("Booking fetch successfully", existing);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
