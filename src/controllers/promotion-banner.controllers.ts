import { Request, Response } from "express";
import { PromotionBannerService } from "services";

const service = new PromotionBannerService();

export class PromotionBannerController {
  async getActiveBanners(req: Request, res: Response) {
    try {
      const data = await service.getActiveBanners();

      return res.json({
        status: true,
        message: "Success",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async recordView(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await service.recordView(
        id,
        (req as any).user?.id,
        req.ip,
        req.headers["user-agent"],
      );

      return res.json({
        status: true,
        message: "View recorded",
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async recordClick(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await service.recordClick(id, (req as any).user?.id);

      return res.json({
        status: true,
        message: "Click recorded",
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  // (admin)
  async createPromotion(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;

      const data = await service.createPromotion(req.body, adminId);

      return res.json({
        status: true,
        message: "Promotion created",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  // (admin)
  async updatePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await service.updatePromotion(id, req.body);

      return res.json({
        status: true,
        message: "Promotion updated",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  // (admin)
  async deactivatePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await service.deactivatePromotion(id);

      return res.json({
        status: true,
        message: "Promotion deactivated",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await service.getAnalytics(id);

      return res.json({
        status: true,
        message: "Success",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}
