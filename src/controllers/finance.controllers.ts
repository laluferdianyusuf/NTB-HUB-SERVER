import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { FinanceService } from "services/finance.services";

const service = new FinanceService();

export class FinanceController {
  async dashboard(req: Request, res: Response) {
    try {
      const venueId = String(req.params.venueId);
      const range = (req.query.range as "7d" | "30d" | "90d" | "1y") || "30d";

      const data = await service.getDashboard(venueId, range);

      return sendSuccess(res, data, "Finance dashboard fetched successfully");
    } catch (error: any) {
      console.log("DASHBOARD", error);

      return sendError(
        res,
        error.message || "Failed to fetch finance dashboard",
      );
    }
  }

  async summary(req: Request, res: Response) {
    try {
      const venueId = String(req.params.venueId);

      const data = await service.getSummary(venueId);

      return sendSuccess(res, data, "Finance summary fetched successfully");
    } catch (error: any) {
      console.log("SUMMARY", error);
      return sendError(res, error.message || "Failed to fetch finance summary");
    }
  }

  async transactions(req: Request, res: Response) {
    try {
      const venueId = String(req.params.venueId);

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const type = req.query.type as string | undefined;

      const data = await service.getTransactions(venueId, page, limit, type);

      return sendSuccess(
        res,
        data,
        "Finance transactions fetched successfully",
      );
    } catch (error: any) {
      console.log("TRANS", error);
      return sendError(res, error.message || "Failed to fetch transactions");
    }
  }

  async withdrawals(req: Request, res: Response) {
    try {
      const venueId = String(req.params.venueId);

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const data = await service.getWithdrawals(venueId, page, limit);

      return sendSuccess(res, data, "Withdrawals fetched successfully");
    } catch (error: any) {
      console.log("WITHDRAW", error);
      return sendError(res, error.message || "Failed to fetch withdrawals");
    }
  }
}
