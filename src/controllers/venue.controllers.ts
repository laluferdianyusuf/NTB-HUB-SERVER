import { Request, Response } from "express";
import { VenueServices } from "../services/venue.services";
import { sendError, sendSuccess } from "helpers/response";

export class VenueControllers {
  private venueServices: VenueServices;

  constructor() {
    this.venueServices = new VenueServices();
  }
  async createVenue(req: Request, res: Response) {
    try {
      const files = req.files as {
        image?: Express.Multer.File;
        gallery?: Express.Multer.File[];
      };

      const result = await this.venueServices.createVenue(req.body, files);

      sendSuccess(res, result, "Venues created successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getVenues(req: Request, res: Response) {
    try {
      const { search, category, subCategory, page, limit, includeServices } =
        req.query;
      const result = await this.venueServices.getVenues({
        search: search as string,
        category: category as string,
        subCategory: subCategory as string,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        includeServices: Boolean(includeServices) || false,
      });

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getPopularVenues(req: Request, res: Response) {
    try {
      const { search, category, subCategory, page, limit, includeServices } =
        req.query;
      const result = await this.venueServices.getPopularVenues({
        search: search as string,
        category: category as string,
        subCategory: subCategory as string,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        includeServices: Boolean(includeServices) || false,
      });

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getActiveVenues(req: Request, res: Response) {
    try {
      const result = await this.venueServices.getActiveVenues();

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getVenueLikedByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const result = await this.venueServices.getVenueLikedByUser(userId);

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async activateVenue(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.venueServices.activateVenue(id);

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getVenueDetail(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.venueServices.getVenueById(id);

      sendSuccess(res, result, "Venues retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
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

      sendSuccess(res, result, "Venues updated successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async deleteVenue(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.venueServices.deleteVenue(id);

      sendSuccess(res, result, "Venues deleted successfully", 203);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async toggleLike(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const userId = req.user?.id;

      const result = await this.venueServices.toggleLike(
        venueId,
        String(userId),
      );
      sendSuccess(res, result, "You like this venue", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getLikeCount(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const userId = req.user?.id;
      const result = await this.venueServices.getLikeCount(
        venueId,
        String(userId),
      );

      sendSuccess(res, result, "Venue likes retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
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
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getImpressionCount(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;

      const result = await this.venueServices.getImpressionCount(venueId);

      sendSuccess(res, result, "Venue impression retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }
}
