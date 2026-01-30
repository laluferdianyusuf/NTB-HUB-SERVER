import { Request, Response } from "express";
import { MenuServices } from "../services/menu.services";

export class MenuControllers {
  private menuService: MenuServices;

  constructor() {
    this.menuService = new MenuServices();
  }
  async createMenu(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.menuService.createMenu(data, req.file);

      res.status(201).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      console.log(error);

      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMenuByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await this.menuService.getMenuByVenueId(venueId);

      res.status(200).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMenuById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.getMenuById(id);

      res.status(200).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await this.menuService.updateMenu(id, data, req.file);

      res.status(200).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.deleteMenu(id);

      res.status(203).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async getAllMenus(req: Request, res: Response) {
    try {
      const result = await this.menuService.getAllMenus();

      res.status(200).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
