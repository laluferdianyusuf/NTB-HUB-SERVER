import { Request, Response } from "express";
import { Server } from "socket.io";
import { PaymentServices } from "../services/payment.services";

export class PaymentController {
  private paymentService: PaymentServices;
  private io?: Server;

  constructor(io?: Server) {
    this.paymentService = new PaymentServices();
    this.io = io;
  }

  async createPayment(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await this.paymentService.createPayment(data);

      if (this.io && result.status) {
        this.io?.emit("payment:created", result.data);
      }
      return res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async handlePaymentCallback(req: Request, res: Response) {
    try {
      const data = req.body;

      const result = await this.paymentService.createPaymentCallback(data);

      if (this.io && result.status) {
        this.io?.emit("payment:callback", result.data);

        this.io.emit("notification:new", {
          userId: result.data.userId,
          title: "Pembayaran Berhasil",
          message: `Transaksi ${result.data.orderId} berhasil.`,
        });
      }
      return res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await this.paymentService.getAllPayments();
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.paymentService.getPaymentById(id);
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }
}
