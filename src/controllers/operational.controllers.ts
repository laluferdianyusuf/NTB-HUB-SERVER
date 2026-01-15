import { OperationalServices } from "services";
const operationalServices = new OperationalServices();
import { Request, Response } from "express";

export class OperationalControllers {
  async createOperationalHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { operationalHours } = req.body;
      const result = await operationalServices.createOperationalHours(
        venueId,
        operationalHours
      );

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getOperationalHours(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await operationalServices.getOperationalHours(venueId);

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
}
