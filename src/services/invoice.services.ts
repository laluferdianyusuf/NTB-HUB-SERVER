import { InvoiceRepository } from "repositories";
const invoiceRepository = new InvoiceRepository();

export class InvoiceServices {
  async findAllInvoice() {
    try {
      const invoice = await invoiceRepository.findAll();

      if (!invoice || invoice.length === 0) {
        return {
          status: false,
          status_code: 404,
          message: "Invoice not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Invoice retrieved successfully",
        data: invoice,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async findInvoiceByBookingId(bookingId: string) {
    try {
      const invoice = await invoiceRepository.findByBookingId(bookingId);

      if (!invoice) {
        return {
          status: false,
          status_code: 404,
          message: "Invoice not found",
          data: null,
        };
      }
      return {
        status: true,
        status_code: 200,
        message: "Invoice retrieved successfully",
        data: invoice,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }
}
