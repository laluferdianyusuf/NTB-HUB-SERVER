import { error, success } from "helpers/return";
import {
  InvoiceRepository,
  UserRepository,
  VenueRepository,
} from "repositories";
const invoiceRepository = new InvoiceRepository();
const userRepository = new UserRepository();
const venueRepository = new VenueRepository();

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

  async findAllInvoiceByUserId(userId: string) {
    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const invoice = await invoiceRepository.findAllByUserId(userId);
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
  async findAllInvoiceByVenueId(venueId: string) {
    try {
      const venue = await venueRepository.findVenueById(venueId);

      if (!venue) {
        return error.error404("Venue not found");
      }

      const invoice = await invoiceRepository.findAllByVenueId(venueId);
      if (!invoice) {
        return error.error404("Invoice not found");
      }
      return success.success200("Invoice retrieved", invoice);
    } catch (err) {
      return error.error500("internal server error" + err);
    }
  }
}
