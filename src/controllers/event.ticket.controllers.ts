import { Request, Response } from "express";
import { EventTicketService } from "../services";

export class EventTicketController {
  private service = new EventTicketService();

  scan = async (req: Request, res: Response) => {
    try {
      const { qrCode } = req.body;
      const venueId = req.venue?.id;

      if (!qrCode) {
        return res.status(400).json({
          status: false,
          message: "QR code required",
        });
      }

      const ticket = await this.service.scanTicket(qrCode, venueId);

      return res.json({
        status: true,
        message: "Ticket valid",
        data: {
          ticketId: ticket.id,
          event: ticket.event.name,
          ticketType: ticket.ticketType.name,
          owner: ticket.user.name,
          usedAt: new Date(),
        },
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
  };
}
