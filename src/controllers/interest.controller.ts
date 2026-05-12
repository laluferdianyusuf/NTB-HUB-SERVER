import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { InterestService } from "../services/interest.service";

const interestService = new InterestService();

export class InterestController {
  async getAll(req: Request, res: Response) {
    try {
      const interests = await interestService.getAllInterests();

      sendSuccess(res, interests, "Interest retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getMine(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

      const interests = await interestService.getMyInterests(userId);

      sendSuccess(res, interests, "My interest successfully retrieve");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async updateMine(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;

      const { interestIds } = req.body;

      const data = await interestService.updateUserInterests(
        userId,
        interestIds,
      );

      sendSuccess(res, data, "Interests updated successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
