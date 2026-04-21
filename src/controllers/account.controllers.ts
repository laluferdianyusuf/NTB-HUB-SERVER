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
}
