import { Request, Response } from "express";
import { VenueServices } from "../services/venue.services";
const venueServices = new VenueServices();

export class VenueControllers {
  async getVenues(req: Request, res: Response) {
    try {
      const result = await venueServices.getVenues();

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getVenueById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await venueServices.getVenueById(id);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async updateVenue(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await venueServices.updateVenue(id, data);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async deleteVenue(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await venueServices.deleteVenue(id);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }
}
