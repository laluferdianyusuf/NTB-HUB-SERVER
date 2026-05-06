import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { AccountService } from "services";

const accountService = new AccountService();

export class AccountController {
  async ensureAccount(req: Request, res: Response) {
    try {
      const account = await accountService.ensureAccount(req.body);

      sendSuccess(res, account, "Account created", 201);
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }

  async getAccountByType(req: Request, res: Response) {
    try {
      const { type, id } = req.params;

      const account = await accountService.getAccountByType(
        type.toUpperCase() as any,
        id,
      );

      sendSuccess(res, account, "Account retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
