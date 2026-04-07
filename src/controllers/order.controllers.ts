import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { OrderServices } from "services/order.services";

export class OrderControllers {
  private orderService: OrderServices;

  constructor() {
    this.orderService = new OrderServices();
  }

  async createNewOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { venueId, items, promoCode } = req.body;

      const result = await this.orderService.createNewOrder({
        venueId,
        userId,
        items,
        promoCode,
      });

      sendSuccess(res, result, "Order created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async cancelOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id as string;

      const result = await this.orderService.cancelOrder(orderId, userId);

      sendSuccess(res, result, "Order created", 203);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async payOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id as string;

      const result = await this.orderService.payOrder(orderId, userId);

      sendSuccess(res, result, "Order payed", 203);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async findAllUsersOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

      const result = await this.orderService.getAllByUser(userId);

      sendSuccess(res, result, "Order retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
