import { Request, Response } from "express";
import { FloorServices } from "../services/floor.services";
const floorServices = new FloorServices();

export class FloorControllers {
  async createFloor(req: Request, res: Response) {
    try {
      const data = req.body;
      const venueId = req.params.venueId;
      const result = await floorServices.createFloor(data, venueId);

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

  async getFloorByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await floorServices.getFloorsByVenueId(venueId);

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

  async getFloorById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await floorServices.getFloorById(id);

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

  async updateFloor(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await floorServices.updateFloor(id, data);

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

  async deleteFloor(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await floorServices.deleteFloor(id);

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
}
