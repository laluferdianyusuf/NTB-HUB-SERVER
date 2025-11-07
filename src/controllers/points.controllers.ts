import { Request, Response } from "express";
import { PointsServices } from "services";

export class PointsController {
  private pointsServices: PointsServices;

  constructor() {
    this.pointsServices = new PointsServices();
  }
  async getUserTotalPoints(req: Request, res: Response) {
    const userId = req.params.userId;
    const result = await this.pointsServices.getUserTotalPoints(userId);

    return res.status(result.status_code).json(result);
  }

  async getPointByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    const result = await this.pointsServices.getPointByUserId(userId);
    return res.status(result.status_code).json(result);
  }
}
