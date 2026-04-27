import { Request, Response } from "express";
import { VenueUnitService } from "services";

export class VenueUnitControllers {
  private venueUnitServices = new VenueUnitService();

  async createVenueUnit(req: Request, res: Response) {
    try {
      const { venueId, serviceId, floorId, name, price, type, isActive } =
        req.body;

      if (!venueId || !serviceId || !name || !price || !type) {
        return res.status(400).json({
          status: false,
          message: "venueId, serviceId, name, price, type are required",
        });
      }

      const result = await this.venueUnitServices.create({
        venueId,
        serviceId,
        floorId,
        name,
        price: Number(price),
        type,
        isActive,
      });

      return res.status(201).json({
        status: true,
        message: "Venue unit created successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async bulkCreateVenueUnit(req: Request, res: Response) {
    try {
      const { venueId, serviceId, type, units } = req.body;

      const result = await this.venueUnitServices.bulkCreate({
        venueId,
        serviceId,
        type,
        units,
      });

      return res.status(201).json({
        status: true,
        message: "Bulk units created successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getUnitByService(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;

      const result = await this.venueUnitServices.getByService(serviceId);

      return res.status(200).json({
        status: true,
        message: "Units retrieved successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getUnitByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await this.venueUnitServices.getByVenue(venueId);

      return res.status(200).json({
        status: true,
        message: "Venue units retrieved successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getAllUnits(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const { search, serviceId, floorId, isActive, page, limit } = req.query;

      const result = await this.venueUnitServices.getAll(venueId, {
        search: search as string,
        serviceId: serviceId as string,
        floorId: floorId as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        page: Number(page || 1),
        limit: Number(limit || 20),
      });

      return res.status(200).json({
        status: true,
        message: "Units list retrieved successfully",
        ...result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getDetailUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.venueUnitServices.getDetail(id);

      return res.status(200).json({
        status: true,
        message: "Unit detail retrieved successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await this.venueUnitServices.getSummary(venueId);

      return res.status(200).json({
        status: true,
        message: "Summary retrieved successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getAvailabilityUnits(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { serviceId, date } = req.query;

      const result = await this.venueUnitServices.getAvailabilityUnits(
        venueId,
        serviceId as string,
        date as string,
      );

      return res.status(200).json({
        status: true,
        message: "Availability retrieved successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async updateVenueUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, price, type, floorId, isActive } = req.body;

      const result = await this.venueUnitServices.update(id, {
        name,
        price: price ? Number(price) : undefined,
        type,
        floorId,
        isActive,
      });

      return res.status(200).json({
        status: true,
        message: "Venue unit updated successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.venueUnitServices.toggleStatus(id);

      return res.status(200).json({
        status: true,
        message: "Unit status updated successfully",
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async deactivateVenueUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.venueUnitServices.deactivate(id);

      return res.status(200).json({
        status: true,
        message: "Venue unit deleted successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }
}
