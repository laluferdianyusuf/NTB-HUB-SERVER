import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { EventService } from "../services";

export class EventController {
  private service = new EventService();

  async create(req: Request, res: Response) {
    try {
      const event = await this.service.createEvent(
        req.body,
        req.file as Express.Multer.File,
      );

      sendSuccess(res, event, "Event retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  getEventDashboard = async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      const result = await this.service.getEventDashboard(eventId);

      sendSuccess(res, result, "Dashboard retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  };

  async listEvent(req: Request, res: Response) {
    try {
      const { search, status, page, limit } = req.query;

      const result = await this.service.getAllEvents({
        search: typeof search === "string" ? search : undefined,
        status:
          typeof status === "string" && status.trim() !== ""
            ? status
            : undefined,
        page: Number(page) > 0 ? Number(page) : 1,
        limit: Number(limit) > 0 ? Number(limit) : 20,
      });

      sendSuccess(res, result, "Event retrieved successfully");
    } catch (error: any) {
      console.error(error);
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async listMergedEvent(req: Request, res: Response) {
    try {
      const { search, status, page, limit } = req.query;

      const result = await this.service.getMergedEvents({
        search: typeof search === "string" ? search : undefined,
        status:
          typeof status === "string" && status.trim() !== ""
            ? status
            : undefined,
        page: Number(page) > 0 ? Number(page) : 1,
        limit: Number(limit) > 0 ? Number(limit) : 20,
      });

      sendSuccess(res, result, "Event merged retrieved successfully");
    } catch (error: any) {
      console.error(error);
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getAllEventsWithDetails(req: Request, res: Response) {
    try {
      const { page, limit, status, search } = req.query;

      const result = await this.service.getAllEventsWithDetails({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        status: status as string,
        search: search as string,
      });

      sendSuccess(res, result, "Event retrieved successfully");
    } catch (error: any) {
      console.error("GET EVENTS ERROR:", error);

      sendError(res, error.message || "Internal Server Error");
    }
  }

  async detailEvent(req: Request, res: Response) {
    try {
      const result = await this.service.getEventDetail(req.params.id);
      sendSuccess(res, result, "Event retrieved successfully");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal Server Error");
    }
  }

  async updateStatusEvent(req: Request, res: Response) {
    const { status } = req.body;
    const event = await this.service.changeStatus(req.params.id, status);

    return res.status(200).json({
      status: true,
      message: "Status updated",
      data: event,
    });
  }

  async removeEvent(req: Request, res: Response) {
    await this.service.deleteEvent(req.params.id);

    return res.status(203).json({
      status: true,
      message: "Event removed",
    });
  }
}
