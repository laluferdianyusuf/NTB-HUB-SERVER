import { Request, Response } from "express";
import { WithdrawService } from "services";

const withdrawService = new WithdrawService();

export class WithdrawController {
  async request(req: Request, res: Response) {
    try {
      const venueId = req.venue.id;
      const result = await withdrawService.requestWithdraw(venueId, req.body);
      res
        .status(201)
        .json({ status: true, message: "Withdraw requested", data: result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const result = await withdrawService.approveWithdraw(req.params.id);
      res.json({
        status: true,
        message: "Venues retrieved successful",
        data: result,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const result = await withdrawService.rejectWithdraw(req.params.id);
      res
        .status(203)
        .json({
          status: true,
          message: "Withdraw rejected successful",
          data: result,
        });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const result = await withdrawService.markAsPaid(req.params.id);
      res
        .status(200)
        .json({
          status: true,
          message: "Withdraw paid successful",
          data: result,
        });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async venueWithdraws(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const data = await withdrawService.getVenueWithdraws(venueId);
      res
        .status(200)
        .json({
          status: true,
          message: "Withdraw venue retrieved successful",
          data: data,
        });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  async allWithdraws(req: Request, res: Response) {
    try {
      const data = await withdrawService.getAllWithdraws();
      res
        .status(200)
        .json({
          status: true,
          message: "All withdraw retrieved successful",
          data: data,
        });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
}
