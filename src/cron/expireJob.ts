import cron from "node-cron";
import { InvoiceRepository } from "../repositories";
import { TransactionRepository } from "../repositories";
import { publisher } from "config/redis.config";

const transactionRepository = new TransactionRepository();
const invoiceRepository = new InvoiceRepository();

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export function startExpireJob() {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const expiredInvoices = await invoiceRepository.findExpiredInvoices(now);

    for (const inv of expiredInvoices) {
      const booking = await invoiceRepository.markInvoiceExpired(inv.id);

      if (!booking.booking?.userId) continue;

      await publishEvent("booking-events", "booking:expired", {
        bookingId: booking.id,
        booking,
        userId: booking.booking.user.id,
      });
    }

    const expiredTx =
      await transactionRepository.findExpiredPendingTransactions(now);

    for (const tx of expiredTx) {
      const result = await transactionRepository.markTransactionExpired(tx.id);

      if (!result.userId) continue;

      await publishEvent("transactions-events", "transaction:expired", {
        transactionId: result.id,
        userId: result.userId,
      });
    }
  });
}
