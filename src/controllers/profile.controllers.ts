import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { ProfileService } from "services";

const service = new ProfileService();

export class ProfileController {
  async getProfile(req: Request, res: Response) {
    try {
      const profileId = req.params.id;
      const viewerId = req.user?.id;

      const profile = await service.getProfile(profileId, viewerId);
      sendSuccess(res, profile);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async viewProfile(req: Request, res: Response) {
    try {
      const profileId = req.params.id;
      const viewerId = req.user?.id;

      await service.viewProfile(profileId, viewerId);

      sendSuccess(res, "Profile viewed");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async toggleLike(req: Request, res: Response) {
    try {
      const profileId = req.params.id;
      const userId = req.user?.id;

      const result = await service.toggleLike(profileId, String(userId));

      sendSuccess(res, result, "Profile liked");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
