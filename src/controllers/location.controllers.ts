import { Request, Response } from "express";
import { LocationService } from "../services";

const locationService = new LocationService();

export class LocationController {
  async trackLocation(req: Request, res: Response) {
    const { userId, latitude, longitude } = req.body;

    try {
      const location = await locationService.trackLocation(
        userId,
        latitude,
        longitude,
      );
      res.status(201).json({
        status: true,
        message: "Location tracked successfully",
        data: location,
      });
    } catch (error: any) {
      console.error("trackLocation error:", error.message);
      res.status(error.message.includes("Missing") ? 400 : 500).json({
        status: false,
        message: error.message,
        data: null,
      });
    }
  }

  async getUserLocations(req: Request, res: Response) {
    const { userId } = req.params;

    try {
      const locations = await locationService.getUserLocations(userId);
      res.status(200).json({
        status: true,
        message: "User locations retrieved successfully",
        data: locations,
      });
    } catch (error: any) {
      console.error("getUserLocations error:", error.message);
      res
        .status(
          error.message.includes("Missing")
            ? 400
            : error.message.includes("No locations")
              ? 404
              : 500,
        )
        .json({
          status: false,
          message: error.message,
          data: null,
        });
    }
  }
}
