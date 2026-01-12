import { Request, Response } from "express";
import { PublicPlaceService } from "../services";
import { PublicPlaceType } from "@prisma/client";

export class PublicPlaceController {
  private publicPlaceService = new PublicPlaceService();

  async list(req: Request, res: Response) {
    const type = req.query.type as PublicPlaceType;

    const data = await this.publicPlaceService.getAll(type);

    res.status(200).json({
      status: true,
      data,
    });
  }

  async detail(req: Request, res: Response) {
    try {
      const data = await this.publicPlaceService.getDetail(req.params.id);
      res.json({ status: true, data });
    } catch {
      res.status(404).json({
        status: false,
        message: "Public place not found",
      });
    }
  }

  async create(req: Request, res: Response) {
    const files = req.files as {
      image?: Express.Multer.File[];
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
        userId
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
