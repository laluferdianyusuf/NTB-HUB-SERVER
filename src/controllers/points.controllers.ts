import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { PointsServices } from "services";

export class PointsController {
  private pointsServices: PointsServices;

  constructor() {
    this.pointsServices = new PointsServices();
  }
  async getUserTotalPoints(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.pointsServices.getUserTotalPoints(userId);
      sendSuccess(res, result, "Points retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getPointByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.pointsServices.getPointByUserId(userId);
      sendSuccess(res, result, "Points retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
