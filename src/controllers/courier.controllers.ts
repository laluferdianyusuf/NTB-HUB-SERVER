import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { CourierService } from "services";

const courierService = new CourierService();

export class CourierController {
  async assignDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;

      const result = await courierService.assignDelivery(deliveryId);

      sendSuccess(res, result, "Driver assigned");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async rejectDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { courierId } = req.body;

      if (!courierId) {
        return res.status(400).json({
          success: false,
          message: "courierId is required",
        });
      }

      const result = await courierService.rejectDelivery(deliveryId, courierId);

      sendSuccess(res, result, "Driver rejected");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async handleTimeout(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;

      const result = await courierService.handleAssignmentTimeout(deliveryId);

      sendSuccess(res, result, "Timeout");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
