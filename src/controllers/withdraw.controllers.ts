import { WithdrawStatus } from "@prisma/client";
import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { WithdrawService } from "services";

const service = new WithdrawService();

export class WithdrawController {
  async request(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      const currentUserId = req.user?.id as string;

      const result = await service.requestWithdraw(
        currentUserId,
        venueId,
        req.body,
      );

      sendSuccess(res, result, "Withdraw created", 201);
    } catch (err: any) {
      console.log(err);

      sendError(res, err || "Internal server error");
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id as string;

      const result = await service.approveWithdraw(id, adminId);

      sendSuccess(res, result, "Withdraw approved");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }

  async processing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id as string;

      const result = await service.markProcessing(id, adminId);
      sendSuccess(res, result, "Withdraw marked as processing");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }

  async paid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id as string;
      const { proofUrl } = req.body;

      const result = await service.markAsPaid(id, adminId, proofUrl);

      sendSuccess(res, result, "Withdraw marked as paid");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id as string;
      const { reason } = req.body;

      if (!reason) {
        sendError(res, "reject reason is required");
      }

      const result = await service.rejectWithdraw(id, adminId, reason);

      sendSuccess(res, result, "Withdraw rejected");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { status, page, limit } = req.query;

      const result = await service.getAllWithdraws({
        status: status as WithdrawStatus,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      sendSuccess(res, result, "Withdrawal retrieved");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }

  async byVenue(req: Request, res: Response) {
    try {
      const { venueId } = req.params;

      const result = await service.getWithdrawsByVenue(venueId);

      sendSuccess(res, result, "Withdrawal retrieved");
    } catch (err: any) {
      sendError(res, err || "Internal server error");
    }
  }
}
