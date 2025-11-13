import { Request, Response } from "express";
import { TableServices } from "../services";
const tableService = new TableServices();

export class TableControllers {
  async createTable(req: Request, res: Response) {
    try {
      const data = req.body;
      const floorId = req.params.floorId;
      const result = await tableService.createTable(data, floorId, req.file);

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

  async getTableByFloorId(req: Request, res: Response) {
    try {
      const floorId = req.params.floorId;
      const result = await tableService.getTableByFloorId(floorId);

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

  async getTableById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await tableService.getTableById(id);

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

  async updateTable(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await tableService.updateTable(id, data, req.file);

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

  async deleteTable(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await tableService.deleteTable(id);

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
