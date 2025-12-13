import { Request, Response } from "express";
import { TableServices } from "../services";

export class TableControllers {
  private tableService: TableServices;

  constructor() {
    this.tableService = new TableServices();
  }

  async createTable(req: Request, res: Response) {
    try {
      const data = req.body;
      const floorId = req.params.floorId;
      const result = await this.tableService.createTable(
        data,
        floorId,
        req.file
      );

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
      const venueId = req.params.venueId;
      const result = await this.tableService.getTableByFloorId(
        floorId,
        venueId
      );

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
      const result = await this.tableService.getTableById(id);

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
      const result = await this.tableService.updateTable(id, data, req.file);

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
      const result = await this.tableService.deleteTable(id);

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

  async getTableStatus(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.tableService.getTablesStatus(id);

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

  async getAvailableTables(req: Request, res: Response) {
    try {
      const { venueId, floorId, date, start, end } = req.query;

      const result = await this.tableService.findAvailableTables(
        String(venueId),
        String(floorId),
        String(date),
        String(start),
        String(end)
      );

      res.status(result.status_code).json(result);
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        status_code: 400,
        message: error.message || "Failed to fetch tables",
      });
    }
  }
}
