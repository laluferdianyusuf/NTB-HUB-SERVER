import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { InvoiceServices } from "services";

export class InvoiceController {
  private invoiceService: InvoiceServices;

  constructor() {
    this.invoiceService = new InvoiceServices();
  }

  async findAllInvoice(req: Request, res: Response) {
    try {
      const result = await this.invoiceService.findAllInvoice();
      sendSuccess(res, result, "All invoices retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
