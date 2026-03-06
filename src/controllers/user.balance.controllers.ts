import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { UserBalanceServices } from "services";

export class UserBalanceController {
  private userBalanceServices: UserBalanceServices;

  constructor() {
    this.userBalanceServices = new UserBalanceServices();
  }

  async getUserBalance(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.userBalanceServices.getUserBalance(userId);
      sendSuccess(res, result, "User balance retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
