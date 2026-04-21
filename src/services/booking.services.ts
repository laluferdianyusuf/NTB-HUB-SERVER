import { Notification, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import { toLocalDBTime } from "helpers/formatIsoDate";
import { cancelBookingReminders } from "queue/bookingReminderQueue";
import {
  cancelBookingLifecycle,
  cancelInvoiceExpiry,
  enqueueBookingComplete,
  enqueueBookingStart,
  enqueueInvoiceExpiry,
} from "queue/invoiceQueue";
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
import { PromotionService } from "./promotion.services";

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
const paymentRepository = new PaymentRepository();
const ledgerRepository = new LedgerRepository();
const accountRepository = new AccountRepository();
const orderRepository = new OrderRepository();
const menuRepository = new MenuRepository();
const orderItemRepository = new OrderItemRepository();

interface CreateBookingProps {
  userId: string;
  venueId: string;
  serviceId: string;
  unitId: string;
  startTime: number;
  endTime: number;
  orders?: { menuId: string; quantity: number }[];
  promoCode?: string;
  sessionId?: string;
  date?: string;
}

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class BookingServices {
  private promotionService = new PromotionService();

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
    const bookingPrice = hours * Number(unit.price);

    const invoiceNumber = `INV-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await bookingRepository.createBooking(
        {
          userId: data.userId,
          venueId: data.venueId,
          serviceId: data.serviceId,
          unitId: data.unitId,
          startTime,
          endTime,
          totalPrice: bookingPrice,
        },
        tx,
      );

      let orderTotal = 0;
      let discount = 0;

      const orderItemsData: any[] = [];
      const promotionInputItems: any[] = [];

      if (data.orders && data.orders.length > 0) {
        const menuIds = data.orders.map((o) => o.menuId);

        const menus = await menuRepository.findMenuByIds(menuIds);

        const menuMap = new Map(menus.map((m) => [m.id, m]));

        for (const item of data.orders) {
          const menu = menuMap.get(item.menuId);
          if (!menu) throw new Error("Menu not found");

          const subtotal = Number(menu.price) * item.quantity;
          orderTotal += subtotal;

          orderItemsData.push({
            menuId: menu.id,
            quantity: item.quantity,
            price: menu.price,
            subtotal,
          });

          promotionInputItems.push({
            menuId: menu.id,
            quantity: item.quantity,
            price: Number(menu.price),
          });
        }
      }

      const promotions = await this.promotionService.applyPromotions({
        venueId: data.venueId,
        userId: data.userId,
        promoCode: data.promoCode,
        items: promotionInputItems,
        orderTotal,
      });

      const freeItems: any[] = [];

      for (const promo of promotions) {
        discount += promo.discountAmount;
        freeItems.push(...promo.freeItems);
      }
      const finalOrderTotal = orderTotal - discount;

      let order = null;

      if (orderItemsData.length > 0 || freeItems.length > 0) {
        order = await orderRepository.create(
          {
            userId: data.userId,
            venueId: data.venueId,
            bookingId: booking.id,
            total: new Prisma.Decimal(finalOrderTotal),
            discount: new Prisma.Decimal(discount),
          },
          tx,
        );

        const itemsToInsert = [
          ...orderItemsData.map((i) => ({
            // ...i,
            orderId: order!.id,
            menuId: i.menuId,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
          ...freeItems.map((f) => ({
            orderId: order!.id,
            menuId: f.menuId,
            quantity: f.quantity,
            subtotal: 0,
          })),
        ];

        await orderItemRepository.createBulkOrders(itemsToInsert, tx);

        for (const promo of promotions) {
          await this.promotionService.recordPromotionUsage(
            promo.promotionId,
            data.userId,
            order.id,
          );
        }
      }

      const invoiceTotal = bookingPrice + finalOrderTotal;

      const invoice = await invoiceRepository.create(
        {
          entityType: "BOOKING",
          entityId: booking.id,
          invoiceNumber,
          amount: invoiceTotal,
          expiredAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        tx,
      );

      await enqueueInvoiceExpiry(invoice.id, invoice.expiredAt!);

      return {
        booking,
        order,
        invoice,
        discount,
        total: invoiceTotal,
        expiredAt: invoice.expiredAt,
      };
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
    await publishEvent("venue-events", "venue:sync", {
      venueId: result.booking.venueId,
      bookings: await this.getVenueDashboard(result.booking.venueId),
    });

    await publishEvent("booking-events", "booking:pending", {
      userId: result.booking.userId,
      data: pendingBookings ?? [],
    });

    await publishEvent("booking-events", "booking:sync", {
      userId: result.booking.userId,
      bookings: await this.getBookingByUserId({
        userId: result.booking.userId,
        status: "all_book",
      }),
    });

    return result;
  }

  async payBooking(bookingId: string, userId: string) {
    const booking = await bookingRepository.findBookingById(bookingId);

    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error();
    if (booking.status !== "PENDING")
      throw new Error("Booking already processed");

    const invoice = await invoiceRepository.findActiveByEntity(
      "BOOKING",
      booking.id,
    );
    if (!invoice || invoice.status !== "PENDING")
      throw new Error("Invoice invalid");

    const userBalance = await ledgerRepository.getBalanceByOwner({ userId });

    if (
      userBalance &&
      Number(userBalance.totalBalance) < Number(invoice.amount)
    )
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

      await userBalanceRepository.decrementBalance(
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

    await enqueueBookingStart(booking.id, new Date(booking.startTime));
    await enqueueBookingComplete(booking.id, new Date(booking.endTime));

    await publishEvent("booking-events", "booking:sync", {
      userId,
      bookings: await this.getBookingByUserId({
        userId,
        status: "all_book",
      }),
    });

    await publishEvent("venue-events", "venue:sync", {
      venueId: booking.venueId,
      bookings: await this.getVenueDashboard(booking.venueId),
    });

    await cancelInvoiceExpiry(invoice.id);

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

    const invoice = await invoiceRepository.findActiveByEntity(
      "BOOKING",
      booking.id,
    );

    if (!invoice) throw new Error("Invoice invalid");

    const totalOrder =
      booking.orders.reduce((orderAcc, order) => {
        const itemsTotal =
          order.items.reduce((itemAcc, item) => {
            return itemAcc + Number(item.subtotal ?? 0);
          }, 0) ?? 0;

        return orderAcc + itemsTotal;
      }, 0) ?? 0;

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    const unitPrice = booking.unit?.price ?? 0;
    const totalField = Number(unitPrice) * durationHours;

    const grandTotal = totalField + totalOrder;

    return {
      ...booking,
      invoice: invoice,
      totals: {
        fields: totalField,
        order: totalOrder,
        grand: grandTotal,
        durationHours,
      },
    };
  }

  async getBookingByUserId(params: {
    userId: string;
    search?: string;
    status?: string;
  }) {
    const { userId, search, status } = params || {};

    const bookings = await bookingRepository.findBookingByUserId({
      userId,
      search,
    });

    const result = await Promise.all(
      bookings.map(async (booking) => {
        const invoice = await invoiceRepository.findActiveByEntity(
          "BOOKING",
          booking.id,
        );

        const start = new Date(booking.startTime).getTime();
        const end = new Date(booking.endTime).getTime();

        let statusKey = "completed_book";

        if (booking.status === "EXPIRED") {
          statusKey = "expired_book";
        } else if (booking.status === "PENDING") {
          statusKey = "paying_book";
        } else if (booking.status === "CANCELLED") {
          statusKey = "cancelled_book";
        } else if (booking.status === "PAID") {
          statusKey = "upcoming_book";
        } else if (booking.status === "ONGOING") {
          statusKey = "ongoing_book";
        } else if (booking.status === "COMPLETED") {
          statusKey = "completed_book";
        }

        if (status && status !== "all_book" && status !== statusKey) {
          return null;
        }

        const totalOrder =
          booking.orders.reduce((orderAcc, order) => {
            const itemsTotal =
              order.items?.reduce((itemAcc, item) => {
                return itemAcc + Number(item.subtotal ?? 0);
              }, 0) ?? 0;

            return orderAcc + itemsTotal;
          }, 0) ?? 0;

        const durationHours = (end - start) / (1000 * 60 * 60);

        const unitPrice = booking.unit?.price ?? 0;
        const totalField = Number(unitPrice) * durationHours;

        return {
          ...booking,
          invoice: invoice ?? null,
          statusKey,
          totals: {
            fields: totalField,
            order: totalOrder,
            grand: totalField + totalOrder,
            durationHours,
          },
        };
      }),
    );

    return result.filter(Boolean);
  }

  async getBookingByVenueId(
    venueId: string,
    tab: string = "all_book",
    search: string = "",
    page: number = 1,
    limit: number = 10,
  ) {
    const result = await bookingRepository.findBookingByVenueId({
      venueId,
      tab,
      search,
      page,
      limit,
    });

    const summaryBase = await bookingRepository.findBookingByVenueId({
      venueId,
      tab: "all_book",
      page: 1,
      limit: 1,
    });

    const now = new Date();

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const allRows = await prisma.booking.findMany({
      where: { venueId },
      select: {
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    const summary = {
      today: allRows.filter(
        (b) => b.startTime >= startToday && b.startTime <= endToday,
      ).length,

      pending: allRows.filter((b) => b.status === "PENDING").length,

      confirmed: allRows.filter(
        (b) => b.status === "PAID" && new Date(b.startTime) > now,
      ).length,

      live: allRows.filter(
        (b) =>
          b.status === "PAID" &&
          new Date(b.startTime) <= now &&
          new Date(b.endTime) >= now,
      ).length,

      completed: allRows.filter(
        (b) =>
          b.status === "COMPLETED" ||
          (b.status === "PAID" && new Date(b.endTime) < now),
      ).length,

      issues: allRows.filter(
        (b) => b.status === "CANCELLED" || b.status === "EXPIRED",
      ).length,
    };

    const bookingIds = result.data.map((item) => item.id);

    const invoices = await invoiceRepository.findActiveByIds(bookingIds);

    const invoiceMap = new Map(invoices.map((inv) => [inv.entityId, inv]));

    const data = result.data.map((booking) => ({
      ...booking,
      invoice: invoiceMap.get(booking.id) ?? null,
    }));

    return {
      message: "Bookings fetched successfully",

      filters: {
        tab,
        search,
        page,
        limit,
      },

      summary,

      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
        totalAllBookings: summaryBase.total,
      },

      data: data,
    };
  }

  async getVenueDashboard(venueId: string) {
    const dashboard = await bookingRepository.getVenueDashboard(venueId);

    return {
      message: "Venue dashboard fetched successfully",

      summary: {
        totalPending: dashboard.summary.pending,
        totalPaid: dashboard.summary.paid,
        totalOngoing: dashboard.summary.ongoing,
        totalCompleted: dashboard.summary.completed,
        totalCancelled: dashboard.summary.cancelled,
        totalExpired: dashboard.summary.expired,
      },

      finance: {
        revenueToday: dashboard.revenueToday,
      },

      bookings: {
        pending: dashboard.pending,
        ongoing: dashboard.ongoing,
        latestCompleted: dashboard.latestCompleted,
      },
    };
  }

  async getBookingPaidByUserId(userId: string) {
    const booking = await bookingRepository.findBookingPaidByUserId(userId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async getBookingCompleteByUserId(userId: string) {
    const bookings =
      await bookingRepository.findBookingCompleteByUserId(userId);

    if (!bookings) {
      throw new Error("Booking not found");
    }

    const result = await Promise.all(
      bookings.map(async (booking) => {
        const invoice = await invoiceRepository.findActiveByEntity(
          "BOOKING",
          booking.id,
        );

        const start = new Date(booking.startTime).getTime();
        const end = new Date(booking.endTime).getTime();

        const totalOrder =
          booking.orders.reduce((orderAcc, order) => {
            const itemsTotal =
              order.items.reduce((itemAcc, item) => {
                return itemAcc + Number(item.subtotal ?? 0);
              }, 0) ?? 0;

            return orderAcc + itemsTotal;
          }, 0) ?? 0;

        const durationHours = (end - start) / (1000 * 60 * 60);
        const unitPrice = booking.unit?.price ?? 0;
        const totalField = Number(unitPrice) * durationHours;

        return {
          ...booking,
          invoice: invoice ?? null,
          totals: {
            fields: totalField,
            order: totalOrder,
            grand: totalField + totalOrder,
            durationHours,
          },
        };
      }),
    );

    return result.filter(Boolean);
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

        const invoice = await invoiceRepository.findActiveByEntity(
          "BOOKING",
          booking.id,
        );

        if (!invoice) throw new Error("Invoice invalid");

        if (invoice) {
          await cancelInvoiceExpiry(invoice.id);
        }

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

        await bookingRepository.updateBookingStatus(
          booking.id,
          "CANCELLED",
          tx,
        );
      });
    } else {
      await bookingRepository.updateBookingStatus(booking.id, "CANCELLED");
    }

    await publishEvent("venue-events", "venue:sync", {
      venueId: booking.venueId,
      bookings: await this.getVenueDashboard(booking.venueId),
    });

    await cancelBookingLifecycle(booking.id);

    await publishEvent("booking-events", "booking:sync", {
      userId: booking.userId,
      bookings: await this.getBookingByUserId({
        userId: booking.userId,
        status: "all_book",
      }),
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

    await publishEvent("booking-events", "booking:sync", {
      userId: booking.userId,
      bookings: await this.getBookingByUserId({
        userId: booking.userId,
        status: "all_book",
      }),
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
