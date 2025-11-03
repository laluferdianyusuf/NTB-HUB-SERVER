import { TransactionServices } from "services";
import { Request, Response } from "express";
import { Server } from "socket.io";

export class TransactionController {
  private transactionServices: TransactionServices;
  private io?: Server;

  constructor(io?: Server) {
    this.transactionServices = new TransactionServices();
    this.io = io;
  }

  async topUp(req: Request, res: Response) {
    const { userId, amount, bankCode } = req.body;
    const result = await this.transactionServices.TopUp({
      userId,
      amount,
      bankCode,
    });

    if (result.status && result.data) {
      this.io?.emit("transaction:created", {
        transactionId: result.data.transactionId,
        amount: result.data.amount,
        status: result.data.status,
        VA: result.data.VA,
      });
    }

    return res.status(result.status_code).json(result);
  }

  async midtransCallback(req: Request, res: Response) {
    res.status(200).send("OK");

    try {
      const result = await this.transactionServices.midtransCallback(req.body);

      if (result.status) {
        this.io?.emit("transaction:updated", {
          transactionId: result.transaction.id,
          status: result.transaction.status,
          amount: result.transaction.amount,
        });
      } else {
        console.error("Failed to process callback:", result.message);
      }
    } catch (error) {
      console.error("Error in midtransCallback:", error);
    }
  }

  async findAllTransactions(req: Request, res: Response) {
    const result = await this.transactionServices.findAllTransactions();
    return res.status(result.status_code).json(result);
  }
}
