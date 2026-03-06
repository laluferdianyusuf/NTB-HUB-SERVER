import {
  Invoice,
  Notification,
  Order,
  OrderItem,
  Prisma,
} from "@prisma/client";
import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import { toLocalDBTime } from "helpers/formatIsoDate";
import { cancelBookingReminders } from "queue/bookingReminderQueue";
import { cancelInvoiceExpiry, enqueueInvoiceExpiry } from "queue/invoiceQueue";
import { AccountRepository } from "repositories/account.repo";
import {
  BookingRepository,
  InvoiceRepository,
  LedgerRepository,
  MenuRepository,
  NotificationRepository,
  OperationalRepository,
  OrderItemRepository,
  OrderRepository,
  PaymentRepository,
  PlatformBalanceRepository,
  UserBalanceRepository,
  VenueBalanceRepository,
  VenueServiceRepository,
  VenueUnitRepository,
} from "../repositories";
import { NotificationService } from "./notification.services";

const bookingRepository = new BookingRepository();
const invoiceRepository = new InvoiceRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();
const venueServiceRepository = new VenueServiceRepository();
const venueUnitRepository = new VenueUnitRepository();
const operationalRepository = new OperationalRepository();
const userBalanceRepository = new UserBalanceRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const platformBalanceRepository = new PlatformBalanceRepository();
const menuRepository = new MenuRepository();
const orderRepository = new OrderRepository();
const orderItemRepository = new OrderItemRepository();
const paymentRepository = new PaymentRepository();
const ledgerRepository = new LedgerRepository();
const accountRepository = new AccountRepository();

interface CreateBookingProps {
  userId: string;
  venueId: string;
  serviceId: string;
  unitId: string;
  startTime: number;
  endTime: number;
  orders?: OrderItem[];
  sessionId?: string;
  date?: string;
}

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class BookingServices {
  async createBooking(data: CreateBookingProps) {
    const service = await venueServiceRepository.findById(data.serviceId);
    if (!service || !service.isActive) {
      throw new Error("Service not available");
    }

    const unit = await venueUnitRepository.findById(data.unitId);
    if (!unit || !unit.isActive) {
      throw new Error("Unit not available");
    }

    const startTime = new Date(
      `${data.date}T${String(data.startTime).padStart(2, "0")}:00:00`,
    );
    const endTime = new Date(
      `${data.date}T${String(data.endTime).padStart(2, "0")}:00:00`,
    );

    if (endTime <= startTime) {
      throw new Error("Invalid booking time range");
    }

    const dayOfWeek = startTime.getDay();

    const operational = await operationalRepository.getOperationalHourOfWeek(
      data.venueId,
      dayOfWeek,
    );

    if (!operational) {
      throw new Error("Venue closed");
    }

    if (
      data.startTime < operational.opensAt ||
      data.endTime > operational.closesAt
    ) {
      throw new Error("Outside operational hours");
    }

    const overlapping = await bookingRepository.checkOverlapping({
      serviceId: data.serviceId,
      unitId: data.unitId,
      startTime,
      endTime,
    });

    if (overlapping) {
      throw new Error("Time slot already booked");
    }

    const hours = data.endTime - data.startTime;
    const totalPrice = hours * Number(unit.price);

    const invoiceNumber = `INV-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await bookingRepository.createBooking({
        data: {
          userId: data.userId,
          venueId: data.venueId,
          serviceId: data.serviceId,
          unitId: data.unitId,
          startTime,
          endTime,
          totalPrice,
        },
        tx,
      });

      let orderAmount = 0;
      let order: Order | null = null;

      if (data.orders?.length) {
        const menusIds = data.orders.map((o) => o.menuId);
        const menus = await menuRepository.findMenuByIds(menusIds, tx);

        const menuMap = new Map(menus.map((m) => [m.id, m]));

        const itemsToInsert = [];

        for (const o of data.orders) {
          const menu = menuMap.get(o.menuId);
          if (!menu) throw new Error("Menu not found");

          const subtotal = Number(menu.price) * o.quantity;
          orderAmount += subtotal;

          itemsToInsert.push({
            menuId: menu.id,
            quantity: o.quantity,
            price: menu.price,
            subtotal,
          });
        }

        order = await orderRepository.create(
          {
            bookingId: booking.id,
            venueId: data.venueId,
            userId: data.userId,
            total: Prisma.Decimal(totalPrice + orderAmount),
          },
          tx,
        );

        await orderItemRepository.createBulkOrders(
          itemsToInsert.map((item) => ({
            ...item,
            orderId: order!.id,
          })),
          tx,
        );
      }

      const invoice = await invoiceRepository.create(
        {
          entityType: "BOOKING",
          entityId: booking.id,
          invoiceNumber,
          amount: totalPrice + orderAmount,
          expiredAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        tx,
      );

      await enqueueInvoiceExpiry(invoice.id, invoice.expiredAt!);

      return { booking, invoice };
    });

    await notificationService.sendToVenueOwner(
      data.venueId,
      `New Booking Is Pending`,
      `Booking with ${invoiceNumber} is created`,
      null,
    );

    const pendingBookings = await bookingRepository.findBookingPendingByUserId(
      result.booking.userId,
    );

    await publishEvent("booking-events", "booking:pending", {
      userId: result.booking.userId,
      data: pendingBookings ?? [],
    });

    await publishEvent("invoice-events", "invoice:created", result.invoice);

    return result;
  }

  async payBooking(bookingId: string, userId: string) {
    const booking = await bookingRepository.findBookingById(bookingId);

    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error();
    if (booking.status !== "PENDING")
      throw new Error("Booking already processed");

    const invoice: Invoice = booking.invoice;
    if (!invoice || invoice.status !== "PENDING")
      throw new Error("Invoice invalid");

    const userBalance = await ledgerRepository.getBalance(userId);

    if (userBalance && Number(userBalance) < Number(invoice.amount))
      throw new Error("Insufficient balance");

    const platformFee = Number(invoice.amount) * 0.1;
    const venueAmount = Number(invoice.amount) - platformFee;

    await prisma.$transaction(async (tx) => {
      const userAccount = await accountRepository.findUserAccount(userId);
      const venueAccount = await accountRepository.findVenueAccount(
        booking.venueId,
      );
      const platformAccount = await accountRepository.findPlatformAccount();

      if (!userAccount || !venueAccount || !platformAccount) {
        throw new Error("Account not found");
      }

      await paymentRepository.create({
        invoiceId: invoice.id,
        amount: Number(invoice.amount),
        method: "WALLET",
        provider: "NTB_HUB",
        providerRef: invoice.invoiceNumber,
      });

      await ledgerRepository.createMany(
        [
          {
            accountId: userAccount?.id as string,
            type: "DEBIT",
            amount: Number(invoice.amount),
            referenceType: "BOOKING_PAYMENT",
            referenceId: booking.id,
          },
          {
            accountId: venueAccount.id,
            type: "CREDIT",
            amount: venueAmount,
            referenceType: "BOOKING_PAYMENT",
            referenceId: booking.id,
          },
          {
            accountId: platformAccount.id,
            type: "CREDIT",
            amount: platformFee,
            referenceType: "FEE",
            referenceId: booking.id,
          },
        ],
        tx,
      );

      await userBalanceRepository.incrementBalance(
        userId,
        Number(invoice.amount),
      );
      await venueBalanceRepository.incrementVenueBalance(
        booking.venueId,
        Number(venueAmount),
      );
      await platformBalanceRepository.incrementBalance(Number(platformFee), tx);

      await invoiceRepository.markPaid(invoice.id, tx);

      await bookingRepository.updateBookingStatus(booking.id, "PAID", tx);
    });

    await cancelInvoiceExpiry(invoice.id);

    await notificationRepository.createNewNotification({
      userId: booking.userId,
      title: "Payment Successful",
      message: `Your payment of ${invoice.amount} for booking ${invoice.invoiceNumber} has been successfully received. Thank you!`,
      type: "Booking",
      isGlobal: false,
    } as Notification);

    await notificationRepository.createNewNotification({
      venueId: booking.venueId,
      title: "Booking Paid",
      message: `Booking ${invoice.invoiceNumber} has been paid. Total received: ${venueAmount}`,
      type: "Booking",
      isGlobal: false,
    } as Notification);

    await notificationRepository.createNewNotification({
      venueId: booking.venueId,
      title: "Platform Fee Collected",
      message: `A platform fee of ${platformFee} has been collected from booking ${invoice.invoiceNumber}.`,
      type: "Payment",
      isGlobal: false,
    } as Notification);

    return { message: "Booking paid successfully" };
  }

  async getAllBookings() {
    await bookingRepository.resetExpiredBookings();
    const booking = await bookingRepository.findAllBooking();
    return booking;
  }

  async getBookingById(id: string) {
    const booking = await bookingRepository.findBookingById(id);

    if (!booking) {
      throw new Error("Book not found");
    }

    return booking;
  }

  async getBookingByUserId(userId: string) {
    const booking = await bookingRepository.findBookingByUserId(userId);

    if (!booking) {
      throw new Error("booking not found");
    }

    return booking;
  }

  async getBookingByVenueId(venueId: string) {
    const booking = await bookingRepository.findBookingByVenueId(venueId);

    if (!booking) {
      throw new Error("booking not found");
    }

    return booking;
  }

  async getBookingPaidByUserId(userId: string) {
    const booking = await bookingRepository.findBookingPaidByUserId(userId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async getBookingPendingByUserId(userId: string) {
    const booking = await bookingRepository.findBookingPendingByUserId(userId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async cancelBooking(id: string) {
    const booking = await bookingRepository.findBookingById(id);

    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status === "PAID") {
      await prisma.$transaction(async (tx) => {
        const userAccount = await accountRepository.findUserAccount(
          booking.userId,
        );
        const venueAccount = await accountRepository.findVenueAccount(
          booking.venueId,
        );

        if (!userAccount || !venueAccount) {
          throw new Error("Account not found");
        }

        const invoice: Invoice = booking.invoice;

        await ledgerRepository.createMany([
          {
            accountId: userAccount?.id as string,
            type: "CREDIT",
            amount: Number(invoice.amount),
            referenceType: "REFUND",
            referenceId: booking.id,
          },
          {
            accountId: booking.venueId,
            type: "DEBIT",
            amount: Number(invoice.amount) * 0.9,
            referenceType: "REFUND",
            referenceId: booking.id,
          },
        ]);
        await userBalanceRepository.incrementBalance(
          booking.userId,
          Number(invoice.amount),
          tx,
        );

        await venueBalanceRepository.decrementVenueBalance(
          booking.venueId,
          Number(invoice.amount),
          tx,
        );

        await bookingRepository.cancelBooking(id, tx);
      });
    } else {
      await bookingRepository.cancelBooking(id);
    }

    const pendingBookings = await bookingRepository.findBookingPendingByUserId(
      booking.userId,
    );

    await publishEvent("booking-events", "booking:pending", {
      userId: booking.userId,
      data: pendingBookings ?? [],
    });

    await cancelBookingReminders(booking.id);

    return { message: "Booking cancelled" };
  }

  async completeBooking(id: string) {
    const booking = await bookingRepository.findBookingById(id);

    if (!booking) {
      throw new Error("Booking not found");
    }

    const updated = await bookingRepository.completeBooking(id);

    const paidBookings = await bookingRepository.findBookingPaidByUserId(
      booking.userId,
    );

    await publishEvent("booking-events", "booking:paid", {
      userId: booking.userId,
      data: paidBookings ?? [],
    });

    return updated;
  }

  async getExistingBooking(
    serviceId: string,
    unitId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const startTimeDB = toLocalDBTime(new Date(startTime));
    const endTimeDB = toLocalDBTime(new Date(endTime));

    const existing = await bookingRepository.existingBooking(
      serviceId,
      unitId,
      startTimeDB,
      endTimeDB,
    );

    return existing;
  }
}
