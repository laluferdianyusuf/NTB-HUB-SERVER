import { Request, Response } from "express";
import { VenueServices } from "../services/venue.services";

export class VenueControllers {
  private venueServices: VenueServices;

  constructor() {
    this.venueServices = new VenueServices();
  }
  async getVenues(req: Request, res: Response) {
    try {
      const result = await this.venueServices.getVenues();

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
      const result = await this.venueServices.getVenueById(id);

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
      const files = req.files as {
        image?: Express.Multer.File[];
        gallery?: Express.Multer.File[];
      };
      const result = await this.venueServices.updateVenue(id, data, files);

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
      const result = await this.venueServices.deleteVenue(id);

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

  async signInWithInvitationKey(req: Request, res: Response) {
    try {
      const { invitationKey } = req.body;
      const result = await this.venueServices.signInWithInvitationKey(
        invitationKey
      );

      res.status(result.status_code).json(result);
    } catch (error) {
      res.status(500).json(error.message || "Internal Server Error");
    }
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    const result = await this.venueServices.refreshVenueToken(refreshToken);
    return res.status(result.status_code).json(result);
  }

  async currentVenue(req: Request, res: Response) {
    try {
      const venue = (req as any).venue;

      res.status(200).json({
        status: true,
        status_code: 200,
        message: "Venue retrieved",
        data: venue,
      });
    } catch (error) {
      throw new error("Error" + error);
    }
  }
}
