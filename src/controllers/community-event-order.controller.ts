import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { CommunityEventOrderService } from "../services";

export class CommunityEventOrderController {
  private orderService = new CommunityEventOrderService();

  createOrder = async (req: Request, res: Response) => {
    try {
      const { eventId, userId, items } = req.body;

      if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid payload",
        });
      }

      const result = await this.orderService.createOrder(
        eventId,
        userId,
        items,
      );

      sendSuccess(res, result, "Order created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  handlePaymentSuccess = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as string;
      const { orderId, items } = req.body;
      const { pin } = req.body;
      const result = await this.orderService.handlePaymentSuccess(
        userId,
        orderId,
        items,
        pin,
      );

      sendSuccess(res, result, "Order payment successful");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  scanQrCode = async (req: Request, res: Response) => {
    try {
      const { qrCode } = req.body;

      const order = await this.orderService.scanQrCode(qrCode);

      sendSuccess(res, order, "Qr Code scanned");
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
