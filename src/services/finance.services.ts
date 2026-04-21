import dayjs from "dayjs";
import {
  BookingRepository,
  InvoiceRepository,
  LedgerRepository,
  WithdrawRepository,
} from "repositories";

const ledgerRepo = new LedgerRepository();
const invoiceRepo = new InvoiceRepository();
const withdrawRepo = new WithdrawRepository();
const bookingRepo = new BookingRepository();

type RangeType = "7d" | "30d" | "90d" | "1y";

export class FinanceService {
  private getDateRange(range: RangeType = "30d") {
    const now = dayjs();

    switch (range) {
      case "7d":
        return now.subtract(7, "day").startOf("day").toDate();

      case "90d":
        return now.subtract(90, "day").startOf("day").toDate();

      case "1y":
        return now.subtract(1, "year").startOf("day").toDate();

      default:
        return now.subtract(30, "day").startOf("day").toDate();
    }
  }

  async getDashboard(venueId: string, range: RangeType = "30d") {
    const fromDate = this.getDateRange(range);

    const [
      balance,
      ledgers,
      invoices,
      withdrawals,
      bookings,
      previousInvoices,
    ] = await Promise.all([
      ledgerRepo.getBalanceByOwner({ venueId }),

      ledgerRepo.getTransactionsByDate(venueId, fromDate),

      invoiceRepo.getInvoicesByVenue(venueId, fromDate),

      withdrawRepo.getWithdrawalsByDate(venueId, fromDate),

      bookingRepo.findCompletedBookingsByVenue(venueId, fromDate),

      invoiceRepo.getInvoicesByVenue(
        venueId,
        dayjs(fromDate).subtract(dayjs().diff(fromDate, "day"), "day").toDate(),
      ),
    ]);

    const paidInvoices = invoices.filter((x) => x.status === "PAID");
    const pendingInvoices = invoices.filter((x) => x.status === "PENDING");
    const expiredInvoices = invoices.filter((x) => x.status === "EXPIRED");

    const grossRevenue = paidInvoices.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const platformFees = grossRevenue * 0.1;

    const refundAmount = ledgers
      .filter((x) => x.referenceType === "REFUND")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const netRevenue = grossRevenue - platformFees - refundAmount;

    const pendingSettlement = pendingInvoices.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const totalWithdrawn = withdrawals
      .filter((x) => x.status === "APPROVED")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const processingWithdraw = withdrawals
      .filter((x) => x.status === "PENDING")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const avgBookingValue =
      bookings.length > 0 ? grossRevenue / bookings.length : 0;

    const refundRatio =
      grossRevenue > 0 ? (refundAmount / grossRevenue) * 100 : 0;

    const prevPaid = previousInvoices.filter(
      (x) => x.status === "PAID" && dayjs(x.createdAt).isBefore(fromDate),
    );

    const previousRevenue = prevPaid.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const growth =
      previousRevenue > 0
        ? ((grossRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const cashflow = this.buildCashflow(paidInvoices);
    console.log(balance);

    return {
      summary: {
        availableBalance: Number(balance?.totalBalance ?? 0),
        grossRevenue,
        netRevenue,
        pendingSettlement,
        platformFees,
        refundAmount,
        totalWithdrawn,
        processingWithdraw,
        growthPercent: Number(growth.toFixed(2)),
      },

      invoices: {
        paid: paidInvoices.length,
        pending: pendingInvoices.length,
        expired: expiredInvoices.length,
      },

      economics: {
        totalBookings: bookings.length,
        avgBookingValue: Math.round(avgBookingValue),
        revenuePerBooking: Math.round(avgBookingValue),
      },

      risk: {
        refundRatio: Number(refundRatio.toFixed(2)),
      },

      cashflow,

      recentWithdrawals: withdrawals.slice(0, 5),

      generatedAt: new Date(),
    };
  }

  async getTransactions(venueId: string, page = 1, limit = 20, type?: string) {
    const skip = (page - 1) * limit;

    const result = await ledgerRepo.getTransactions(venueId, skip, limit, type);

    return {
      page,
      limit,
      ...result,
    };
  }

  async getWithdrawals(venueId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const result = await withdrawRepo.getWithdrawalsPaginated(
      venueId,
      skip,
      limit,
    );

    return {
      page,
      limit,
      ...result,
    };
  }

  async getSummary(venueId: string) {
    const data = await this.getDashboard(venueId, "30d");

    return data.summary;
  }

  private buildCashflow(invoices: any[]) {
    const map: Record<string, number> = {};

    invoices.forEach((item) => {
      const key = dayjs(item.createdAt).format("DD MMM");

      map[key] = (map[key] || 0) + Number(item.amount);
    });

    return Object.entries(map).map(([date, value]) => ({
      date,
      value,
    }));
  }
}
