import { Request, Response } from "express";
import { EventTicketService } from "../services";

export class EventTicketController {
  private service = new EventTicketService();

  async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "ID_REQUIRED",
        });
      }

      const result = await this.service.getTicketById(id);

      return res.status(200).json({
        message: "TICKET FOUND",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "TICKET NOT FOUND",
      });
    }
  }

  async getTicketByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      console.log(userId);

      if (!userId) {
        return res.status(400).json({
          message: "USER_ID_REQUIRED",
        });
      }

      const result = await this.service.getTicketByUserId(userId);

      return res.status(200).json({
        message: "TICKET FOUND",
        data: result,
      });
    } catch (error: any) {
      console.log(res);

      return res.status(400).json({
        message: error.message || "TICKET NOT FOUND",
      });
    }
  }

  async getTicketByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          message: "ORDER_ID_REQUIRED",
        });
      }

      const result = await this.service.getTicketByOrderId(orderId);

      return res.status(200).json({
        message: "TICKET FOUND",
        data: result,
      });
    } catch (error: any) {
      console.log(res);

      return res.status(400).json({
        message: error.message || "TICKET NOT FOUND",
      });
    }
  }
}
