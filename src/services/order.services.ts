import { PrismaClient } from "@prisma/client";
import { publisher } from "config/redis.config";
import {
  OrderRepository,
  MenuRepository,
  BookingRepository,
  UserBalanceRepository,
  InvoiceRepository,
} from "repositories";
const orderRepository = new OrderRepository();
const menuRepository = new MenuRepository();
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const invoiceRepository = new InvoiceRepository();

const prisma = new PrismaClient();

export class OrderServices {
  async createNewOrder({
    bookingId,
    items,
  }: {
    bookingId: string;
    items: { menuId: string; quantity: number }[];
  }) {
    try {
      const booking = await bookingRepository.findBookingById(bookingId);
      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const invoiceNumber = `INV-${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      const menuItems = [] as any;
      for (const item of items) {
        const menu = await menuRepository.findMenuById(item.menuId);
        if (!menu) {
          return {
            status: false,
            status_code: 404,
            message: `Menu with ID ${item.menuId} not found`,
            data: null,
          };
        }

        const subTotal = menu.price * item.quantity;

        menuItems.push({
          menuId: item.menuId,
          quantity: item.quantity,
          subtotal: subTotal,
        });
      }
      const result = await prisma.$transaction(async (tx) => {
        await orderRepository.createBulkOrders(bookingId, menuItems, tx);

        const increase = menuItems.reduce((acc, cur) => acc + cur.subtotal, 0);

        const updatedBooking = await bookingRepository.updateBookingTotal(
          bookingId,
          increase
        );

        if (!updatedBooking.invoice) {
          await invoiceRepository.create(
            {
              bookingId,
              invoiceNumber,
              amount: updatedBooking.totalPrice,
            },
            tx
          );
        } else {
          await invoiceRepository.updateInvoiceAmount(bookingId, increase, tx);
        }

        return { booking: updatedBooking, increase };
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
        status_code: 201,
        message: "Order created",
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async updateOrder({ id, quantity }: { id: string; quantity: number }) {
    try {
      const order = await orderRepository.getOrderById(id);

      if (!order) {
        return {
          status: false,
          status_code: 404,
          message: "Order not found",
          data: null,
        };
      }

      if (!order.menu) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      const subtotal = (order.menu?.price || 0) * quantity;

      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await orderRepository.updateOrder(
          id,
          quantity,
          subtotal,
          tx
        );

        const updatedBooking = await bookingRepository.recalculateBookingTotal(
          order.bookingId,
          tx
        );

        return { updatedOrder, updatedBooking };
      });

      await publisher.publish(
        "order-events",
        JSON.stringify({
          event: "order:updated",
          payload: result.updatedOrder,
        })
      );

      return {
        status: true,
        status_code: 200,
        message: "Order updated",
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async deleteOrder(id: string) {
    try {
      const order = await orderRepository.getOrderById(id);

      if (!order) {
        return {
          status: false,
          status_code: 404,
          message: "Order not found",
          data: null,
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        const deletedOrder = await orderRepository.deleteOrder(id, tx);

        const updatedBooking = await bookingRepository.recalculateBookingTotal(
          order.bookingId,
          tx
        );

        return { deletedOrder, updatedBooking };
      });

      await publisher.publish(
        "order-events",
        JSON.stringify({
          event: "order:deleted",
          payload: result.deletedOrder,
        })
      );
      return {
        status: true,
        status_code: 200,
        message: "Order deleted",
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
  async getOrderById(id: string) {
    try {
      const order = await orderRepository.getOrderById(id);

      if (!order) {
        return {
          status: false,
          status_code: 404,
          message: "Order not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Order retrieved",
        data: order,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async findAllOrder() {
    try {
      const orders = await orderRepository.findAllOrders();

      return {
        status: true,
        status_code: 200,
        message: "Orders retrieved",
        data: orders,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async findByBookingId(bookingId: string) {
    try {
      const orders = await orderRepository.findByBookingId(bookingId);

      return {
        status: true,
        status_code: 200,
        message: "Orders retrieved",
        data: orders,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async processOrderPayment(bookingId: string) {
    try {
      const booking = await bookingRepository.findBookingById(bookingId);
      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
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

      const payments = await orderRepository.processOrdersPayment(
        booking,
        paymentId,
        10
      );

      await publisher.publish(
        "booking-events",
        JSON.stringify({
          event: "booking:paid",
          payload: payments.updatedBooking,
        })
      );
      await publisher.publish(
        "notification-events",
        JSON.stringify({
          event: "notification:send",
          payload: payments.notification,
        })
      );
      await publisher.publish(
        "points-events",
        JSON.stringify({
          event: "points:updated",
          payload: payments.createdPoint,
        })
      );
      await publisher.publish(
        "transaction-events",
        JSON.stringify({
          event: "transaction:updated",
          payload: payments.transaction,
        })
      );
      await publisher.publish(
        "balance-events",
        JSON.stringify({
          event: "balance:updated",
          payload: payments.updateBalance,
        })
      );

      return {
        status: true,
        status_code: 200,
        message: "Order payment processed successfully",
        data: payments,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
}
