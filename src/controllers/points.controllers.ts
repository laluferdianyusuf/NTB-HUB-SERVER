import { Request, Response } from "express";
import { PointsServices } from "services";
import { Server } from "socket.io";

export class PointsController {
  private pointsServices: PointsServices;
  private io?: Server;

  constructor(io?: Server) {
    this.pointsServices = new PointsServices();
    this.io = io;
  }
  async getUserTotalPoints(req: Request, res: Response) {
    const userId = req.params.userId;
    const result = await this.pointsServices.getUserTotalPoints(userId);

    if (result.status && result.data) {
      this.io?.emit("points:updated", {
        totalPoints: result.data,
      });
    }

    return res.status(result.status_code).json(result);
  }

  async getPointByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    const result = await this.pointsServices.getPointByUserId(userId);
    return res.status(result.status_code).json(result);
  }
}
