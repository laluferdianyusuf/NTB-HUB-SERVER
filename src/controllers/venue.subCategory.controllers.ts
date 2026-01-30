import { Request, Response } from "express";
import { VenueSubCategoryService } from "../services";

export class VenueSubCategoryController {
  private venueSubCategoryService = new VenueSubCategoryService();

  async createSubCategory(req: Request, res: Response) {
    try {
      const { categoryId, name, code, description, defaultConfig } = req.body;

      if (!categoryId || !name || !code || !defaultConfig) {
        return res.status(400).json({
          message: "categoryId, name, code, and defaultConfig are required",
        });
      }

      const subCategory = await this.venueSubCategoryService.create({
        categoryId,
        name,
        code,
        description,
        defaultConfig,
      });

      return res.status(201).json({
        status: true,
        message: "Venue sub-category created successfully",
        data: subCategory,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getSubCategoryByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;

      const subCategories =
        await this.venueSubCategoryService.getByCategory(categoryId);

      return res.status(200).json({
        status: true,
        message: "Sub-category retrieved successful",
        data: subCategories,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getAllSubCategory(req: Request, res: Response) {
    try {
      const subCategories =
        await this.venueSubCategoryService.getAllSubCategory();

      return res.status(200).json({
        status: true,
        message: "Sub-categories retrieved successful",
        data: subCategories,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
      });
    }
  }
  async createMany(req: Request, res: Response) {
    try {
      const { categoryId, items } = req.body;

      if (!categoryId || !items) {
        return res
          .status(400)
          .json({ message: "categoryId and items are required" });
      }

      const result = await this.venueSubCategoryService.createMany(
        categoryId,
        items,
      );
      return res
        .status(201)
        .json({ message: "VenueSubCategories created", data: result });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  }
}
