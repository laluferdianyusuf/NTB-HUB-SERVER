import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { LogServices } from "services";

export class LogController {
  private logServices: LogServices;

  constructor() {
    this.logServices = new LogServices();
  }

  async getAllLogs(req: Request, res: Response) {
    try {
      const response = await this.logServices.getAllLogs();
      sendSuccess(res, response, "Logs retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async findLogByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const response = await this.logServices.findLogByUserId(userId);
      sendSuccess(res, response, "Logs retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
