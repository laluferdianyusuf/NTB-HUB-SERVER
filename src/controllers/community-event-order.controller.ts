import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { CommunityEventOrderService } from "../services";

export class CommunityEventOrderController {
  private orderService = new CommunityEventOrderService();

  createOrder = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const { communityEventId } = req.params;
      const { items, paymentMethod } = req.body;

      const idempotencyKey = req.headers["idempotency-key"] as string;

      if (!idempotencyKey) {
        return res.status(400).json({
          message: "Idempotency key required",
        });
      }

      const result = await this.orderService.createOrder({
        userId,
        communityEventId,
        items,
        paymentMethod,
        idempotencyKey,
      });

      sendSuccess(res, result, "Order created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  handlePaymentSuccess = async (req: Request, res: Response) => {
    try {
      const { orderId, items } = req.body;

      const result = await this.orderService.handlePaymentSuccess(
        orderId,
        items,
      );

      sendSuccess(res, result, "Order payment successful");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  getEventOrders = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;

      const result = await this.orderService.getEventOrders(userId);
      sendSuccess(res, result, "Tickets retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  async getDetail(req: Request, res: Response) {
    try {
      const orderId = req.params.id;

      const order = await this.orderService.getOrderDetail(orderId);

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order not found",
        });
      }

      sendSuccess(res, order, "Event orders retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
