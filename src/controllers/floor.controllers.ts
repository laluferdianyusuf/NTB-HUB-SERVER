import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { FloorServices } from "../services/floor.services";
const floorServices = new FloorServices();

export class FloorControllers {
  async createFloor(req: Request, res: Response) {
    try {
      const data = req.body;
      const venueId = req.params.venueId;
      const result = await floorServices.createFloor(data, venueId);

      sendSuccess(res, result, "Floor created", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getFloorByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await floorServices.getFloorsByVenueId(venueId);

      sendSuccess(res, result, "Floor retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getFloorById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await floorServices.getFloorById(id);

      sendSuccess(res, result, "Floor retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async updateFloor(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await floorServices.updateFloor(id, data);

      sendSuccess(res, result, "Floor updated");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async deleteFloor(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await floorServices.deleteFloor(id);

      sendSuccess(res, result, "Floor deleted");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
