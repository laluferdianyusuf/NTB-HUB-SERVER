import { InvoiceServices } from "services";
import { Response, Request } from "express";

export class InvoiceController {
  private invoiceService: InvoiceServices;

  constructor() {
    this.invoiceService = new InvoiceServices();
  }

  async findAllInvoice(req: Request, res: Response) {
    const result = await this.invoiceService.findAllInvoice();

    res.status(result.status_code).json(result);
  }

  async findInvoiceByBookingId(req: Request, res: Response) {
    const bookingId = req.params.bookingId;
    const result = await this.invoiceService.findInvoiceByBookingId(bookingId);

    res.status(result.status_code).json(result);
  }
}
