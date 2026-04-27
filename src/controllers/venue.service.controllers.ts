import { BookingType, UnitType } from "@prisma/client";
import { Request, Response } from "express";
import { VenueServiceService } from "../services";

export class VenueServiceController {
  private venueServiceService = new VenueServiceService();

  async createVenueService(req: Request, res: Response) {
    try {
      const { venueId, subCategoryId, bookingType, unitType, config } =
        req.body;

      const file = req.file;

      const data = await this.venueServiceService.create(
        {
          venueId,
          subCategoryId,
          bookingType,
          unitType,
          config,
        },
        file,
      );

      return res.status(201).json({
        status: true,
        message: "Venue service created successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async updateVenueService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bookingType, unitType, config, isActive } = req.body;

      const file = req.file;

      const data = await this.venueServiceService.update(
        id,
        {
          bookingType,
          unitType,
          config,
          isActive,
        },
        file,
      );

      return res.status(200).json({
        status: true,
        message: "Venue service updated successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getServiceByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const data = await this.venueServiceService.getByVenue(venueId);

      return res.status(200).json({
        status: true,
        message: "Venue services retrieved successfully",
        data,
      });
    } catch (error: any) {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getAllServiceByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const query = {
        search: req.query.search as string,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === "true"
            : undefined,
        bookingType: req.query.bookingType as BookingType,
        unitType: req.query.unitType as UnitType,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const data = await this.venueServiceService.getAllServiceByVenue(
        venueId,
        query,
      );

      return res.status(200).json({
        status: true,
        message: "All venue services retrieved successfully",
        data,
      });
    } catch (error: any) {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getDetailService(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await this.venueServiceService.getDetail(id);

      return res.status(200).json({
        status: true,
        message: "Venue service detail retrieved successfully",
        data,
      });
    } catch (error: any) {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await this.venueServiceService.toggleStatus(id);

      return res.status(200).json({
        status: true,
        message: `Service ${
          data.isActive ? "activated" : "deactivated"
        } successfully`,
        data,
      });
    } catch (error: any) {
      console.log(error);

      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async deactivateVenueService(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.venueServiceService.deactivate(id);

      return res.status(200).json({
        status: true,
        message: "Venue service deactivated successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async deleteVenueService(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.venueServiceService.delete(id);

      return res.status(200).json({
        status: true,
        message: "Venue service deleted successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const data = await this.venueServiceService.getSummary(venueId);

      return res.status(200).json({
        status: true,
        message: "Summary retrieved successfully",
        data,
      });
    } catch (error: any) {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
  }
}
