import { Request, Response } from "express";
import { InvoiceServices } from "services";

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

  async findAllInvoiceByUserId(req: Request, res: Response) {
    const userId = req.user?.id as string;

    const result = await this.invoiceService.findAllInvoiceByUserId(userId);

    res.status(result.status_code).json(result);
  }

  async findAllInvoiceByVenueId(req: Request, res: Response) {
    const venueId = req.params.venueId;

    const result = await this.invoiceService.findAllInvoiceByVenueId(venueId);

    res.status(result.status_code).json(result);
  }

  async findAllPaidInvoiceByVenueId(req: Request, res: Response) {
    const venueId = req.params.venueId;

    const result =
      await this.invoiceService.findAllPaidInvoiceByVenueId(venueId);
    console.log(result);

    res.status(result.status_code).json(result);
  }
}
