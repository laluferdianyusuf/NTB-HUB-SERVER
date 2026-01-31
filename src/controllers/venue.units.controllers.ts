import { Request, Response, NextFunction } from "express";
import { VenueUnitService } from "services";

export class VenueUnitControllers {
  private venueUnitServices = new VenueUnitService();

  async createVenueUnit(req: Request, res: Response) {
    try {
      const { venueId, serviceId, floorId, name, price, type } = req.body;

      if (!venueId || !serviceId || !type) {
        return res.status(400).json({
          status: false,
          message: "venueId,serviceId, name, price and type are required",
        });
      }

      const venueUnits = await this.venueUnitServices.create({
        venueId,
        serviceId,
        floorId,
        name,
        price,
        type,
      });

      return res.status(201).json({
        status: true,
        message: "Venue units created successfully",
        data: venueUnits,
      });
    } catch (err) {
      console.log(err);

      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getUnitByService(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;

      const venueUnits = await this.venueUnitServices.getByService(serviceId);

      return res.status(200).json({
        status: true,
        message: "Units by service retrieved successful",
        data: venueUnits,
      });
    } catch (err) {
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
      console.log(date);

      const result = await this.venueUnitServices.getAvailabilityUnits(
        venueId,
        serviceId as string,
        date as string,
      );

      return res.status(200).json({
        status: true,
        message: "Units availability retrieved successful",
        data: result,
      });
    } catch (err) {
      console.log(err);

      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getUnitByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const venueUnits = await this.venueUnitServices.getByVenue(venueId);

      return res.status(200).json({
        status: true,
        message: "Units by venue retrieved successful",
        data: venueUnits,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getDetailUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const venueUnits = await this.venueUnitServices.getDetail(id);

      return res.status(200).json({
        status: true,
        message: "Units by venue retrieved successful",
        data: venueUnits,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async updateVenueUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, price, type } = req.body;

      const venueUnits = await this.venueUnitServices.update(id, {
        name,
        price,
        type,
      });

      return res.status(201).json({
        status: true,
        message: "Venue units updated successfully",
        data: venueUnits,
      });
    } catch (err) {
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
        message: "Venue unit deactivated successfully",
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }
}
