import {
  Booking,
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
} from "../repositories";
import { publisher } from "config/redis.config";
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const tableRepository = new TableRepository();
const invoiceRepository = new InvoiceRepository();
const transactionRepository = new TransactionRepository();
const notificationRepository = new NotificationRepository();
const pointRepository = new PointsRepository();
const prisma = new PrismaClient();
export class BookingServices {
  async createBooking(data: Booking) {
    const invoiceNumber = `INV-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}`;
    try {
      const tables = await tableRepository.findTablesById(data.tableId);

      if (!tables) {
        return {
          status: false,
          status_code: 404,
          message: "Table not found",
          data: null,
        };
      } else if (tables.status === "BOOKED") {
        return {
          status: false,
          status_code: 400,
          message: "This table is booked",
          data: null,
        };
      } else if (tables.status === "MAINTENANCE") {
        return {
          status: false,
          status_code: 400,
          message: "This table is under maintenance",
          data: null,
        };
      }
      const existingBooking = await bookingRepository.existingBooking(
        data.tableId,
        data.startTime,
        data.endTime
      );

      if (existingBooking) {
        return {
          status: false,
          status_code: 400,
          message: "Booking exist",
          data: null,
        };
      }
      const result = await prisma.$transaction(async (tx) => {
        const createdBooking = await bookingRepository.createBooking(data, tx);
        const invoice = await invoiceRepository.create(
          {
            bookingId: createdBooking.id,
            invoiceNumber: invoiceNumber,
            amount: createdBooking.totalPrice,
            paymentMethod: TransactionType.DEDUCTION,
          },
          tx
        );

        return { createdBooking, invoice };
      });

      await publisher.publish(
        "booking-events",
        JSON.stringify({
          event: "booking:created",
          payload: result.createdBooking,
        })
      );

      return {
        status: true,
        status_code: 201,
        message: "Booking created successfully",
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

  async updateBookingPayment(id: string) {
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

      if (booking.status === "PAID") {
        return {
          status: false,
          status_code: 400,
          message: `This book already paid`,
          data: null,
        };
      }

      const balance = await userBalanceRepository.getBalanceByUserId(
        booking.userId
      );

      const paymentId = `PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      if (!balance || balance < booking.totalPrice) {
        return {
          status: false,
          status_code: 400,
          message: "Insufficient balance",
          data: null,
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        const bookings = await bookingRepository.processBookingPayment(
          booking.id,
          tx
        );

        const transaction = await transactionRepository.create(
          {
            userId: booking.userId,
            venueId: booking.venueId,
            amount: booking.totalPrice,
            type: TransactionType.DEDUCTION,
            status: TransactionStatus.SUCCESS,
            reference: booking.id,
            orderId: paymentId,
          },
          tx
        );

        const points = await pointRepository.generatePoints(
          {
            userId: booking.userId,
            activity: PointActivityType.BOOKING,
            points: 10,
            reference: booking.id,
          },
          tx
        );

        const balance = await userBalanceRepository.decrementBalance(
          booking.userId,
          booking.totalPrice,
          tx
        );
        await invoiceRepository.updateInvoicePaid(id, tx);

        const notification = await notificationRepository.createNewNotification(
          {
            userId: booking.userId,
            title: "Payment Successful",
            message: `Thank you! Your payment of ${booking.totalPrice} has been successfully received.`,
          },
          tx
        );

        const tables = await tableRepository.updateTableStatus(
          booking.tableId,
          TableStatus.BOOKED,
          tx
        );

        return {
          bookings,
          transaction,
          points,
          balance,
          notification,
          tables,
        };
      });

      await publisher.publish(
        "booking-events",
        JSON.stringify({
          event: "booking:paid",
          payload: result.transaction,
        })
      );

      await publisher.publish(
        "points-events",
        JSON.stringify({
          event: "point:updated",
          payload: result.points,
        })
      );

      await publisher.publish(
        "notification-events",
        JSON.stringify({
          event: "notification:send",
          payload: result.notification,
        })
      );

      await publisher.publish(
        "tables-events",
        JSON.stringify({
          event: "tables:updated",
          payload: result.tables,
        })
      );

      return {
        status: true,
        status_code: 200,
        message: "Booking payment processed successfully",
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

  async getAllBookings() {
    try {
      await bookingRepository.resetExpiredBookings();
      const booking = await bookingRepository.findAllBooking();
      return {
        status: true,
        status_code: 200,
        message: "Booking retrieved",
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

  async getBookingById(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

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
        const booking = await bookingRepository.cancelBooking(id, tx);

        const invoice = await invoiceRepository.updateInvoiceCanceled(id, tx);

        return { booking, invoice };
      });

      await publisher.publish(
        "booking-events",
        JSON.stringify({
          event: "booking:updated",
          payload: result.booking,
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
}
