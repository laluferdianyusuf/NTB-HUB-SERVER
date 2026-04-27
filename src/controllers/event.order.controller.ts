import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { EventOrderService } from "../services";

export class EventOrderController {
  private service = new EventOrderService();

  async checkout(req: Request, res: Response) {
    try {
      const { eventId, userId, items } = req.body;

      if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid payload",
        });
      }

      const result = await this.service.checkout(userId, eventId, items);

      sendSuccess(res, result, "Ticket checked out");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async paymentWebhook(req: Request, res: Response) {
    try {
      const { eventOrderId, items } = req.body;

      if (!eventOrderId) {
        return res.status(400).json({
          status: false,
          message: "eventOrderId is required",
        });
      }

      const result = await this.service.markPaid(eventOrderId, items);

      sendSuccess(res, result, "Payment successful", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getUsersOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

      const order = await this.service.getUserEvents(userId);

      sendSuccess(res, order, "Event orders retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getEventsOrder(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const order = await this.service.getEventsOrder(eventId);

      sendSuccess(res, order, "Event orders retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getDetail(req: Request, res: Response) {
    try {
      const orderId = req.params.id;

      const order = await this.service.getOrderDetail(orderId);

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
