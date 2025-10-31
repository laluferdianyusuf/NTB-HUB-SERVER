import { Request, Response } from "express";
import { OrderServices } from "services/order.services";

export class OrderControllers {
  private orderService: OrderServices;

  constructor() {
    this.orderService = new OrderServices();
  }

  async createNewOrder(req: Request, res: Response) {
    const { bookingId, menuId, quantity } = req.body;

    const result = await this.orderService.createNewOrder({
      bookingId,
      menuId,
      quantity,
    });

    res.status(result.status_code).json(result);
  }

  async updateOrder(req: Request, res: Response) {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await this.orderService.updateOrder({
      id,
      quantity,
    });

    res.status(result.status_code).json(result);
  }

  async deleteOrder(req: Request, res: Response) {
    const { id } = req.params;

    const result = await this.orderService.deleteOrder(id);

    res.status(result.status_code).json(result);
  }

  async getOrderById(req: Request, res: Response) {
    const { id } = req.params;

    const result = await this.orderService.getOrderById(id);

    res.status(result.status_code).json(result);
  }
}
