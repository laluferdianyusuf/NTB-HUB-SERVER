import { Request, Response } from "express";
import { EventOrderService } from "../services";

export class EventOrderController {
  private service = new EventOrderService();

  async checkout(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { eventId, items } = req.body;

      if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid payload",
        });
      }

      const result = await this.service.checkout(userId, eventId, items);

      return res.status(201).json({
        status: true,
        message: "Ticket checked out",
        data: result,
      });
    } catch (err: any) {
      const errorMap: Record<string, { code: number; message: string }> = {
        TICKET_NOT_AVAILABLE: {
          code: 404,
          message: "Ticket not available",
        },
        TICKET_SOLD_OUT: {
          code: 409,
          message: "Ticket sold out",
        },
      };

      const mappedError = errorMap[err.message];

      return res.status(mappedError?.code || 500).json({
        status: false,
        message: mappedError?.message || "Internal server error",
      });
    }
  }

  async paymentWebhook(req: Request, res: Response) {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          status: false,
          message: "transactionId is required",
        });
      }

      await this.service.markPaid(transactionId);

      return res.json({
        status: true,
        message: "Payment processed",
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Failed to process payment",
      });
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

      return res.json({
        status: true,
        data: order,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }
}
