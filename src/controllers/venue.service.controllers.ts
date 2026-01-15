import { Request, Response } from "express";
import { VenueServiceService } from "../services";

export class VenueServiceController {
  private venueServiceService = new VenueServiceService();

  async createVenueService(req: Request, res: Response) {
    try {
      const { venueId, subCategoryId, bookingType, unitType, config } =
        req.body;

      if (!subCategoryId) {
        return res.status(400).json({
          message: "subCategoryId is required",
        });
      }

      const service = await this.venueServiceService.create({
        venueId,
        subCategoryId,
        bookingType,
        unitType,
        config,
      });

      return res.status(201).json({
        status: true,
        message: "Venue service created successfully",
        data: service,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async updateVenueService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bookingType, unitType, config, isActive } = req.body;

      const service = await this.venueServiceService.update(id, {
        bookingType,
        unitType,
        config,
        isActive,
      });

      return res.status(200).json({
        status: true,
        message: "Venue service updated successfully",
        data: service,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getServiceByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const services = await this.venueServiceService.getByVenue(venueId);

      return res.status(200).json({
        status: true,
        message: "Venue retrieved successful",
        data: services,
      });
    } catch (err) {
      return res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getDetailService(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const service = await this.venueServiceService.getDetail(id);

      return res.status(200).json({
        status: true,
        message: "Venue detail retrieved successful",
        data: service,
      });
    } catch (err) {
      return res.status(404).json({
        status: false,
        message: err.message,
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
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }
}
