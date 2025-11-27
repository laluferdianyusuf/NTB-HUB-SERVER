import { TransactionServices } from "services";
import { Request, Response } from "express";

export class TransactionController {
  private transactionServices: TransactionServices;

  constructor() {
    this.transactionServices = new TransactionServices();
  }

  async topUp(req: Request, res: Response) {
    const { userId, amount, bankCode } = req.body;
    const result = await this.transactionServices.TopUp({
      userId,
      amount,
      bankCode,
    });

    return res.status(result.status_code).json(result);
  }
  async topUpQris(req: Request, res: Response) {
    const { userId, amount } = req.body;
    const result = await this.transactionServices.TopUpQris({
      userId,
      amount,
    });

    return res.status(result.status_code).json(result);
  }
  async topUpRetail(req: Request, res: Response) {
    const { userId, amount, store } = req.body;
    const result = await this.transactionServices.TopUpRetail({
      userId,
      amount,
      store,
    });

    return res.status(result.status_code).json(result);
  }

  async midtransCallback(req: Request, res: Response) {
    res.status(200).send("OK");

    try {
      await this.transactionServices.midtransCallback(req.body);
    } catch (error) {
      console.error("Error in midtransCallback:", error);
    }
  }

  async findAllTransactions(req: Request, res: Response) {
    const result = await this.transactionServices.findAllTransactions();
    return res.status(result.status_code).json(result);
  }
}
