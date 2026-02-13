import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { WithdrawService } from "services";

const withdrawService = new WithdrawService();

export class WithdrawController {
  async request(req: Request, res: Response) {
    try {
      const venueId = req.venue.id;
      const result = await withdrawService.requestWithdraw(
        req.user.id,
        venueId,
        req.body,
      );

      sendSuccess(res, result, "Withdraw send to admin", 201);
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const result = await withdrawService.approveWithdraw(req.params.id);
      sendSuccess(res, result, "Withdraw approved", 201);
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const result = await withdrawService.rejectWithdraw(req.params.id);

      sendSuccess(res, result, "Withdraw rejected", 201);
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const result = await withdrawService.markAsPaid(req.params.id);

      sendSuccess(res, result, "Withdraw paid successfully");
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async venueWithdraws(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await withdrawService.getWithdrawsByVenue(venueId);

      sendSuccess(res, result, "Withdraw retrieved successfully");
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async allWithdraws(req: Request, res: Response) {
    try {
      const result = await withdrawService.getAllWithdraws();
      sendSuccess(res, result, "Withdraw retrieved successfully");
    } catch (error) {
      sendError(res, error.message || "Internal Server Error");
    }
  }
}
