import { MenuRepository } from "repositories/menu.repo";
import { OrderRepository } from "repositories/order.repo";
const orderRepository = new OrderRepository();
const menuRepository = new MenuRepository();

export class OrderServices {
  async createNewOrder({
    bookingId,
    menuId,
    quantity,
  }: {
    bookingId: string;
    menuId: string;
    quantity: number;
  }) {
    try {
      const menu = await menuRepository.findMenuById(menuId);

      if (!menu) {
        return {
          status: false,
          status_code: 404,
          message: "Menu not found",
          data: null,
        };
      }

      const subtotal = menu.price * quantity;

      const createdOrder = await orderRepository.addOrderItem({
        bookingId,
        menuId,
        quantity,
        subtotal,
      });

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
}
