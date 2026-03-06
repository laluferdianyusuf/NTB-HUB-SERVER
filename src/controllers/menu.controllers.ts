import { Request, Response } from "express";
import { sendError } from "helpers/response";
import { MenuServices } from "../services/menu.services";

export class MenuControllers {
  private menuService: MenuServices;

  constructor() {
    this.menuService = new MenuServices();
  }
  async createMenu(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.menuService.createMenu(
        data,
        req.file as Express.Multer.File,
      );

      res.status(201).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }

  async getMenuByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await this.menuService.getMenuByVenueId(venueId);

      res.status(200).json({
        status: true,
        message: "Menu retrieved successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getMenuById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.getMenuById(id);

      res.status(200).json({
        status: true,
        message: "Menu retrieved successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async updateMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await this.menuService.updateMenu(
        id,
        data,
        req.file as Express.Multer.File,
      );

      res.status(200).json({
        status: true,
        message: "Menu created successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async deleteMenu(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.menuService.deleteMenu(id);

      res.status(203).json({
        status: true,
        message: "Menu deleted successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
  async getAllMenus(req: Request, res: Response) {
    try {
      const result = await this.menuService.getAllMenus();

      res.status(200).json({
        status: true,
        message: "Menu retrieved successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
