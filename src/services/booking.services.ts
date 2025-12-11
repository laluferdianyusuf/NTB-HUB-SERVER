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

      await publishEvent("invoice-events", "invoice:created", fullInvoice);

      return success.success201("Booking created successfully", result);
    } catch (err) {
      console.log(err);
      return error.error500("Internal server error" + err);
    }
  }

  async updateBookingPayment(id: string) {
    try {
      const invoice = await invoiceRepository.findByBookingId(id);
      if (!invoice) {
        return {
          status: false,
          status_code: 404,
          message: "Invoice not found",
          data: null,
        };
      }

      const booking = await bookingRepository.findBookingById(id);
      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      if (invoice.status === "PAID") {
        return {
          status: false,
          status_code: 400,
          message: "This booking is already paid",
          data: null,
        };
      }

      if (invoice.expiredAt && invoice.expiredAt < new Date()) {
        return {
          status: false,
          status_code: 400,
          message: "Invoice expired",
          data: null,
        };
      }

      const userBalance = await userBalanceRepository.getBalanceByUserId(
        booking.userId
      );

      if (!userBalance || userBalance < invoice.amount) {
        return {
          status: false,
          status_code: 400,
          message: "Insufficient balance",
          data: null,
        };
      }

      const paymentId = `PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      const result = await prisma.$transaction(async (tx) => {
        const processedBooking = await bookingRepository.processBookingPayment(
          booking.id,
          tx
        );

        const transaction = await transactionRepository.create(
          {
            userId: booking.userId,
            venueId: booking.venueId,
            amount: invoice.amount,
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

        const updatedBalance = await userBalanceRepository.decrementBalance(
          booking.userId,
          invoice.amount,
          tx
        );

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

        const updatedTable = await tableRepository.updateTableStatus(
          booking.tableId,
          TableStatus.BOOKED,
          tx
        );

        return {
          booking: processedBooking,
          transaction,
          points,
          balance: updatedBalance,
          invoice: updatedInvoice,
          notification,
          table: updatedTable,
        };
      });

      await publishEvent("booking-events", "booking:paid", result.transaction);
      await publishEvent("points-events", "point:updated", result.points);
      await publishEvent(
        "notification-events",
        "notification:send",
        result.notification
      );
      await publishEvent("tables-events", "tables:updated", result.table);

      return {
        status: true,
        status_code: 200,
        message: "Booking payment processed successfully",
        data: result,
      };
    } catch (error) {
      console.error("updateBookingPayment error:", error);
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
}
