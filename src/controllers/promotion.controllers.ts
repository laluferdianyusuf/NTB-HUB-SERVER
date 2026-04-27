import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { PromotionService } from "services";
import { CreatePromotionInput } from "../types/promotion-create.types";

export class PromotionController {
  private promotionService = new PromotionService();

  async createPromotion(req: Request, res: Response) {
    try {
      const data: CreatePromotionInput = req.body;

      const promotion = await this.promotionService.createPromotion(data);

      sendSuccess(res, promotion, "Promotion added to this venue", 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  async approvePromotion(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;

      const adminId = req.user?.id as string;

      const promotion = await this.promotionService.approvePromotion(
        promotionId,
        adminId,
      );

      sendSuccess(res, promotion, "Promotion approved");
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  async rejectPromotion(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;

      const promotion =
        await this.promotionService.rejectPromotion(promotionId);

      sendSuccess(res, promotion, "Promotion rejected");
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  async getPromotionSummary(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await this.promotionService.getSummary(venueId);

      sendSuccess(res, result, "Promotion summary fetched");
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  async getPromotionByVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const { search, status, page = "1", limit = "20" } = req.query;

      const result = await this.promotionService.getByVenue({
        venueId,
        search: search as string,
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      sendSuccess(res, result, "Promotions fetched");
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
