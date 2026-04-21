import { Request, Response } from "express";
import { CourierService } from "services";

const courierService = new CourierService();

export class CourierController {
  async assignDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;

      const result = await courierService.assignDelivery(deliveryId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
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

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async handleTimeout(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;

      const result = await courierService.handleAssignmentTimeout(deliveryId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
