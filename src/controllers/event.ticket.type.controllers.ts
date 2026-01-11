import { Request, Response } from "express";
import { EventTicketTypeService } from "../services";

export class EventTicketTypeController {
  private service = new EventTicketTypeService();

  async create(req: Request, res: Response) {
    try {
      const { eventId, name, price, quota } = req.body;

      const ticketType = await this.service.createTicketType({
        eventId,
        name,
        price,
        quota,
      });

      res.status(201).json({
        status: true,
        message: "Ticket type created",
        data: ticketType,
      });
    } catch (err: any) {
      res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getByEvent(req: Request, res: Response) {
    const { eventId } = req.params;

    const data = await this.service.getByEvent(eventId);

    res.json({
      status: true,
      data,
    });
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await this.service.updateTicketType(id, data);

      res.json({
        status: true,
        message: "Ticket type updated",
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await this.service.deleteTicketType(id);

    res.json({
      status: true,
      message: "Ticket type deleted",
    });
  }
}
