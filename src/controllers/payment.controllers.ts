import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { PaymentServices } from "services";

export class PaymentController {
  private paymentServices: PaymentServices;

  constructor() {
    this.paymentServices = new PaymentServices();
  }

  async topUp(req: Request, res: Response) {
    try {
      const { userId, amount, bankCode } = req.body;
      const result = await this.paymentServices.TopUp({
        userId,
        amount,
        bankCode,
      });

      sendSuccess(res, result, "Top up successful", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
  async topUpQris(req: Request, res: Response) {
    const { userId, amount } = req.body;
    const result = await this.paymentServices.TopUpQris({
      userId,
      amount,
    });

    sendSuccess(res, result, "Top up successful", 201);
  }
  async midtransCallback(req: Request, res: Response) {
    res.status(200).send("OK");

    try {
      await this.paymentServices.midtransCallback(req.body);
    } catch (error) {
      console.error("Error in midtransCallback:", error);
    }
  }

  async getPaymentsByUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.paymentServices.findAllPaymentsByUserId(
        userId,
        cursor,
        limit,
      );

      sendSuccess(res, result, "Transaction retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
