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

  async getTransactionsByUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.transactionServices.findAllTransactionsByUserId(
        userId,
        cursor,
        limit,
      );

      return res.status(result.status_code).json(result);
    } catch (error: any) {
      return res.status(500).json({
        status: false,
        status_code: 500,
        message: "Internal server error: " + error.message,
        data: null,
      });
    }
  }

  async findAllTransactionsByVenueId(req: Request, res: Response) {
    const venueId = req.params.venueId;

    const result =
      await this.transactionServices.findAllTransactionsByVenueId(venueId);
    return res.status(result.status_code).json(result);
  }

  async findTransactionsById(req: Request, res: Response) {
    try {
      const id = req.params.id;

      const result = await this.transactionServices.findTransactionById(id);
      return res.status(200).json({
        status: true,
        message: "Transaction found successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }
}
