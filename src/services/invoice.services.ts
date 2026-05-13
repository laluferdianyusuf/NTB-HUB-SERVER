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
  async findAllInvoice() {
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
}
