import { Request, Response } from "express";
import { MenuServices } from "../services/menu.services";
import { publisher } from "config/redis.config";

export class MenuControllers {
  private menuService: MenuServices;

  constructor() {
    this.menuService = new MenuServices();
  }
  async createMenu(req: Request, res: Response) {
    try {
      const data = req.body;
      const venueId = req.params.venueId;
      const result = await this.menuService.createMenu(data, venueId, req.file);

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

  async getMenuByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await this.menuService.getMenuByVenueId(venueId);

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

  async getMenuById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.getMenuById(id);

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

  async updateMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await this.menuService.updateMenu(id, data, req.file);

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

  async deleteMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.deleteMenu(id);

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
