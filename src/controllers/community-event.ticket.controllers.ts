import { Request, Response } from "express";
import { CommunityEventTicketService } from "../services";
import { sendError, sendSuccess } from "helpers/response";

export class CommunityEventTicketController {
  private service = new CommunityEventTicketService();

  async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.service.getTicketById(id);

      sendSuccess(res, result, "Ticket found");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getTicketByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const result = await this.service.getTicketByUserId(userId);

      sendSuccess(res, result, "Ticket found");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getTicketByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const result = await this.service.getTicketByOrderId(orderId);

      sendSuccess(res, result, "Ticket found");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
