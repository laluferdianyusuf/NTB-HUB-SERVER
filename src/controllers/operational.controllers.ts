import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { OperationalServices } from "services";
const operationalServices = new OperationalServices();

export class OperationalControllers {
  async createOperationalHours(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const { operationalHours } = req.body;
      const result = await operationalServices.createOperationalHours(
        venueId,
        operationalHours,
      );
      sendSuccess(res, result, "Operational hours created");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getOperationalHours(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await operationalServices.getOperationalHours(venueId);
      sendSuccess(res, result, "Operational hours retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
