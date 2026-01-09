import cron from "node-cron";
import { InvoiceRepository } from "../repositories";
import { TransactionRepository } from "../repositories/";
const transactionRepository = new TransactionRepository();
const invoiceRepository = new InvoiceRepository();

export function startExpireJob() {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    console.log("[JOB RUNNING] Executing job");

    const expiredInvoices = await invoiceRepository.findExpiredInvoices(now);
    for (const inv of expiredInvoices) {
      await invoiceRepository.markInvoiceExpired(inv.id);
      console.log("Invoice expired:", inv.id);
    }

    const expiredTx =
      await transactionRepository.findExpiredPendingTransactions(now);
    for (const tx of expiredTx) {
      await transactionRepository.markTransactionExpired(tx.id);
      console.log("Transaction expired:", tx.id);
    }
  });
}
