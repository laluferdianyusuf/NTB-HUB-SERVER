import { error, success } from "helpers/return";
import {
  BookingRepository,
  CommunityEventOrderRepository,
  EventOrderRepository,
  InvoiceRepository,
  OrderRepository,
  UserRepository,
  VenueRepository,
} from "repositories";
const invoiceRepository = new InvoiceRepository();
const userRepository = new UserRepository();
const venueRepository = new VenueRepository();
const bookingRepository = new BookingRepository();
const orderRepository = new OrderRepository();
const eventOrderRepository = new EventOrderRepository();
const communityEventOrderRepository = new CommunityEventOrderRepository();

export class InvoiceServices {
  async findAllInvoice(userId: string) {
    const invoices = await invoiceRepository.findAllInvoices();

    const activities = await Promise.all(
      invoices.map(async (invoice) => {
        switch (invoice.entityType) {
          case "BOOKING":
            const booking = await bookingRepository.findBookingById(
              invoice.entityId,
            );

            if (!booking) return null;
            return {
              type: "BOOKING",
              title: `Booking di ${booking.venue.name}`,
              amount: invoice.amount,
              status: invoice.status,
              createdAt: invoice.createdAt,
            };
          case "ORDER":
            const order = await orderRepository.findById(invoice.entityId);

            if (!order) return null;

            return {
              type: "ORDER",
              title: `Order di ${order.venue.name}`,
              amount: invoice.amount,
              status: invoice.status,
              createdAt: invoice.createdAt,
            };

          case "EVENT_ORDER":
            const eventOrder = await eventOrderRepository.findById(
              invoice.entityId,
            );

            if (!eventOrder) return null;

            return {
              type: "EVENT",
              title: `Beli tiket ${eventOrder.event.name}`,
              amount: invoice.amount,
              status: invoice.status,
              createdAt: invoice.createdAt,
            };

          case "COMMUNITY_EVENT_ORDER":
            const communityEventOrder =
              await communityEventOrderRepository.findById(invoice.entityId);

            if (!communityEventOrder) return null;

            return {
              type: "EVENT",
              title: `Beli tiket ${communityEventOrder.communityEvent.community.name}`,
              amount: invoice.amount,
              status: invoice.status,
              createdAt: invoice.createdAt,
            };

          case "TOPUP":
            return {
              type: "TOPUP",
              title: `Topup saldo`,
              amount: invoice.amount,
              status: invoice.status,
              createdAt: invoice.createdAt,
            };

          default:
            return null;
        }
      }),
    );

    return activities.filter(Boolean);
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

  async findAllPaidInvoiceByVenueId(venueId: string) {
    try {
      const venue = await venueRepository.findVenueById(venueId);

      if (!venue) {
        return error.error404("Venue not found");
      }

      const invoice = await invoiceRepository.findAllPaidByVenueId(venueId);

      if (!invoice) {
        return error.error404("Invoice not found");
      }
      return success.success200("Invoice retrieved", invoice);
    } catch (err) {
      return error.error500("internal server error" + err);
    }
  }
}
