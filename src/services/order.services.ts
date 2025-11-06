import {
  OrderRepository,
  MenuRepository,
  BookingRepository,
  UserBalanceRepository,
} from "repositories";
const orderRepository = new OrderRepository();
const menuRepository = new MenuRepository();
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();

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

      const menuItems = [];
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

      const createdOrder = await orderRepository.createBulkOrders(
        bookingId,
        invoiceNumber,
        menuItems
      );

      return {
        status: true,
        status_code: 201,
        message: "Order created",
        data: createdOrder,
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
      const menu = await menuRepository.findMenuById(order.menuId);

      if (!menu) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      const subtotal = (menu?.price || 0) * quantity;

      const updatedOrder = await orderRepository.updateOrder(
        id,
        order.bookingId,
        quantity,
        subtotal
      );

      return {
        status: true,
        status_code: 200,
        message: "Order updated",
        data: updatedOrder,
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

      const deletedOrder = await orderRepository.deleteOrder(id);

      return {
        status: true,
        status_code: 200,
        message: "Order deleted",
        data: deletedOrder,
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
