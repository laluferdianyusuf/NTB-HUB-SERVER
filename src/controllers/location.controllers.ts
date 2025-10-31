import { Request, Response } from "express";
import { Server } from "socket.io";
import { LocationServices } from "../services/location.services";

export class LocationController {
  private locationService = new LocationServices();
  private io?: Server;

  constructor(io?: Server) {
    this.io = io;
  }

  async track(req: Request, res: Response) {
    const result = await this.locationService.trackLocation(req.body);

    if (this.io && result.status) {
      this.io.emit("location:update", result.data);
    }

    res.status(result.status_code).json(result);
  }

  async getLocations(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await this.locationService.getUserLocations(userId);

    res.status(result.status_code).json(result);
  }
}
