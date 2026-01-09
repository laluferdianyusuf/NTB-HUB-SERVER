import { Request, Response } from "express";
import { WithdrawService } from "services";

const withdrawService = new WithdrawService();

export class WithdrawController {
  async request(req: Request, res: Response) {
    try {
      const venueId = req.venue.id;
      const result = await withdrawService.requestWithdraw(venueId, req.body);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const result = await withdrawService.approveWithdraw(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const result = await withdrawService.rejectWithdraw(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const result = await withdrawService.markAsPaid(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async venueWithdraws(req: Request, res: Response) {
    const venueId = req.venue.id;
    const data = await withdrawService.getVenueWithdraws(venueId);
    res.json(data);
  }

  async allWithdraws(req: Request, res: Response) {
    const data = await withdrawService.getAllWithdraws();
    res.json(data);
  }
}
