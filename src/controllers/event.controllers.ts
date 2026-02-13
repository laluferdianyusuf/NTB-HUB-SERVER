import { Request, Response } from "express";
import { EventService } from "../services";
import { sendError, sendSuccess } from "helpers/response";

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
