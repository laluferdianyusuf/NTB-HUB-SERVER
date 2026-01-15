import { Request, Response, NextFunction } from "express";
import { VenueCategoryService } from "../services";

export class VenueCategoryController {
  private venueCategoryService = new VenueCategoryService();

  async createCategory(req: Request, res: Response) {
    try {
      const { name, code, icon } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          message: "name and code are required",
        });
      }

      const category = await this.venueCategoryService.create({
        name,
        code,
        icon,
      });

      return res.status(201).json({
        status: true,
        message: "Venue category created successfully",
        data: category,
      });
    } catch (err: any) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getAllCategory(_req: Request, res: Response) {
    try {
      const categories = await this.venueCategoryService.getAll();

      return res.status(200).json({
        status: true,
        message: "Categories retrieved successful",
        data: categories,
      });
    } catch (err) {
      return res.status(404).json({
        status: false,
        message: err.message,
      });
    }
  }
}
