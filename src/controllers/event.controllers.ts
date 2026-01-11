import { Request, Response } from "express";
import { EventService } from "../services";

export class EventController {
  private service = new EventService();

  async create(req: Request, res: Response) {
    try {
      const event = await this.service.createEvent(req.body);

      return res.status(201).json({
        status: true,
        message: "Event created",
        data: event,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async listEvent(_: Request, res: Response) {
    const events = await this.service.getEvents();
    return res.json({ status: true, data: events });
  }

  async detailEvent(req: Request, res: Response) {
    try {
      const event = await this.service.getEventDetail(req.params.id);
      return res.json({ status: true, data: event });
    } catch (err: any) {
      return res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  }

  async updateStatusEvent(req: Request, res: Response) {
    const { status } = req.body;
    const event = await this.service.changeStatus(req.params.id, status);

    return res.json({
      status: true,
      message: "Status updated",
      data: event,
    });
  }

  async removeEvent(req: Request, res: Response) {
    await this.service.deleteEvent(req.params.id);
    return res.json({
      status: true,
      message: "Event removed",
    });
  }
}
