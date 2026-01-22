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

      res.status(200).json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getPopularVenues(req: Request, res: Response) {
    try {
      const result = await this.venueServices.getPopularVenues();

      res.status(200).json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getVenuesByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const result = await this.venueServices.getVenuesByCategoryId(categoryId);

      res.status(200).json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getPopularVenuesByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const result =
        await this.venueServices.getPopularVenuesByCategoryId(categoryId);

      res.status(200).json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getActiveVenues(req: Request, res: Response) {
    try {
      const result = await this.venueServices.getActiveVenues();

      res.status(200).json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getVenueLikedByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const result = await this.venueServices.getVenueLikedByUser(userId);

      res.status(200).json({
        status: true,
        message: "Venue retrieved",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async activateVenue(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.venueServices.activateVenue(id);

      res.status(200).json({
        status: true,
        message: "Venue activated",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
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
        image?: Express.Multer.File;
        gallery?: Express.Multer.File[];
      };
      const result = await this.venueServices.updateVenue(id, data, files);

      res.status(200).json({
        status: true,
        message: "Venue updated successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
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
      const result =
        await this.venueServices.signInWithInvitationKey(invitationKey);

      res.status(result.status_code).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const result = await this.venueServices.refreshVenueToken(refreshToken);
      return res.status(result.status_code).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
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
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async toggleLike(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const userId = req.user.id;

      const result = await this.venueServices.toggleLike(venueId, userId);

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to toggle like",
      });
    }
  }

  async getLikeCount(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const userId = req.user?.id;
      const result = await this.venueServices.getLikeCount(venueId, userId);

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch like count",
      });
    }
  }

  async createImpression(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const userId = req.user?.id;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      await this.venueServices.createImpression({
        venueId,
        userId,
        ipAddress,
        userAgent,
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to create impression",
      });
    }
  }

  async getImpressionCount(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;

      const result = await this.venueServices.getImpressionCount(venueId);

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch impression count",
      });
    }
  }
}
