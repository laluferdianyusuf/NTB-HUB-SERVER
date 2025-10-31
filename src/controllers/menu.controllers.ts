import { Request, Response } from "express";
import { MenuServices } from "../services/menu.services";
const menuService = new MenuServices();

export class MenuControllers {
  async createMenu(req: Request, res: Response) {
    try {
      const data = req.body;
      const venueId = req.params.venueId;
      const result = await menuService.createMenu(data, venueId);

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
      const result = await menuService.getMenuByVenueId(venueId);

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
      const result = await menuService.getMenuById(id);

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
      const result = await menuService.updateMenu(id, data);

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
      const result = await menuService.deleteMenu(id);

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
