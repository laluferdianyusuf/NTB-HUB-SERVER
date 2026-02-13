import { Request, Response } from "express";
import { PublicPlaceService } from "../services";
import { sendError, sendSuccess } from "helpers/response";

export class PublicPlaceController {
  private publicPlaceService = new PublicPlaceService();

  async list(req: Request, res: Response) {
    try {
      const { search, type, page, limit } = req.query;

      const result = await this.publicPlaceService.getAll({
        search: search as string,
        type: type as string,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });

      sendSuccess(res, result, "Places retrieved successfully");
    } catch (error) {
      console.error(error);
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async detail(req: Request, res: Response) {
    try {
      const result = await this.publicPlaceService.getDetail(req.params.id);
      sendSuccess(res, result, "Places retrieved successfully");
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async create(req: Request, res: Response) {
    const files = req.files as {
      image?: Express.Multer.File;
      gallery?: Express.Multer.File[];
    };

    const data = await this.publicPlaceService.create(req.body, files);
    res
      .status(201)
      .json({ status: true, message: "Public place created", data });
  }

  async update(req: Request, res: Response) {
    const data = await this.publicPlaceService.update(req.params.id, req.body);
    res.json({ status: true, data });
  }

  async deactivate(req: Request, res: Response) {
    await this.publicPlaceService.deactivate(req.params.id);
    res.json({
      status: true,
      message: "Public place deactivated",
    });
  }

  async toggleLike(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId;
      const userId = req.user.id;

      const result = await this.publicPlaceService.toggleLike(placeId, userId);

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to toggle like",
      });
    }
  }

  async getLikeCount(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId;
      const userId = req.user?.id;
      const result = await this.publicPlaceService.getLikeCount(
        placeId,
        userId,
      );

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch like count",
      });
    }
  }

  async createImpression(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId;
      const userId = req.user?.id;

      await this.publicPlaceService.createImpression({
        placeId,
        userId,
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to create impression",
      });
    }
  }

  async getImpressionCount(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId;

      const result = await this.publicPlaceService.getImpressionCount(placeId);

      return res.status(result.status_code).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch impression count",
      });
    }
  }
}
