import { Request, Response } from "express";
import { EventTicketService } from "../services";

export class EventTicketController {
  private service = new EventTicketService();

  async scan(req: Request, res: Response) {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(400).json({
          status: false,
          message: "QR code required",
        });
      }

      const ticket = await this.service.scanTicket(qrCode);

      return res.status(200).json({
        status: true,
        message: "Ticket valid",
        data: ticket,
      });
    } catch (err: any) {
      const map: Record<string, number> = {
        TICKET_NOT_FOUND: 404,
        TICKET_ALREADY_USED: 409,
        INVALID_VENUE: 403,
      };

      return res.status(map[err.message] || 500).json({
        status: false,
        message: err.message.replaceAll("_", " "),
      });
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const { ticketId } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          message: "TICKET_ID_REQUIRED",
        });
      }

      await this.service.verifyTicket(ticketId);

      return res.status(200).json({
        message: "TICKET_VERIFIED",
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "VERIFY_FAILED",
      });
    }
  }

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
