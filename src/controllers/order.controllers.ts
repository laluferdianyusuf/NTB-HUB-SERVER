import { Request, Response } from "express";
import { OrderServices } from "services/order.services";

export class OrderControllers {
  private orderService: OrderServices;

  constructor() {
    this.orderService = new OrderServices();
  }

  async createNewOrder(req: Request, res: Response) {
    const { bookingId, items } = req.body;

    const result = await this.orderService.createNewOrder({
      bookingId,
      items,
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

  async findAllOrders(req: Request, res: Response) {
    const result = await this.orderService.findAllOrder();

    res.status(result.status_code).json(result);
  }

  async findByBookingId(req: Request, res: Response) {
    const { bookingId } = req.params;

    const result = await this.orderService.findByBookingId(bookingId);
    res.status(result.status_code).json(result);
  }

  async processOrderPayment(req: Request, res: Response) {
    const { bookingId } = req.params;
    const result = await this.orderService.processOrderPayment(bookingId);

    res.status(result.status_code).json(result);
  }
}
