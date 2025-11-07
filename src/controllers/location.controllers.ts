import { Request, Response } from "express";
import { Server } from "socket.io";
import { LocationServices } from "../services/location.services";

export class LocationController {
  private locationService: LocationServices;

  constructor() {
    this.locationService = new LocationServices();
  }

  async track(req: Request, res: Response) {
    const result = await this.locationService.trackLocation(req.body);

    res.status(result.status_code).json(result);
  }

  async getLocations(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await this.locationService.getUserLocations(userId);

    res.status(result.status_code).json(result);
  }
}
