import {
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
} from "../repositories";
import { publisher } from "config/redis.config";
import { error, success } from "helpers/return";
import { normalizeDate } from "helpers/formatIsoDate";
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const tableRepository = new TableRepository();
const invoiceRepository = new InvoiceRepository();
const transactionRepository = new TransactionRepository();
const notificationRepository = new NotificationRepository();
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

export class BookingServices {
  async createBooking(data: Props) {
    const startTime = normalizeDate(String(data.startTime));
    const endTime = normalizeDate(String(data.endTime));

    const invoiceNumber = `INV-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}`;

    try {
      const table = await tableRepository.findTablesById(data.tableId);

      if (!table) return error.error404("Table not found");
      if (table.status === "BOOKED")
        return error.error400("This table is booked");
      if (table.status === "MAINTENANCE")
        return error.error400("This table is under maintenance");

      const overlapping = await bookingRepository.existingBooking(
        data.tableId,
        startTime,
        endTime
      );
      if (overlapping) return error.error400("Booking exist");

      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            userId: data.userId,
            venueId: data.venueId,
            tableId: data.tableId,
            startTime: startTime,
            endTime: endTime,
            totalPrice: data.totalPrice,
          },
        });

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

        const invoice = await tx.invoice.create({
          data: {
            bookingId: booking.id,
            invoiceNumber,
            amount: totalInvoiceAmount,
            paymentMethod: "DEDUCTION",
          },
        });

        await tx.table.update({
          where: { id: booking.tableId },
          data: { status: "BOOKED" },
        });

        return { booking, orderItems, invoice };
      });

      return success.success201("Booking created successfully", result);
    } catch (err) {
      console.log(err);
      return error.error500("Internal server error" + err);
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
          } as Notification
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
