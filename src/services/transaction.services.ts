import crypto from "crypto";
import { Transaction } from "@prisma/client";
import { TransactionRepository, UserRepository } from "../repositories";
import { midtrans } from "config/midtrans.config";
import { publisher } from "config/redis.config";

const transactionRepository = new TransactionRepository();
const userRepository = new UserRepository();

export class TransactionServices {
  async TopUp(data: { userId: string; amount: number; bankCode: string }) {
    try {
      const user = await userRepository.findById(data.userId);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const topUpId = `TOPUP-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const transactionData: Partial<Transaction> = {
        userId: data.userId,
        amount: data.amount,
        type: "TOPUP",
        status: "PENDING",
        bankCode: data.bankCode.toUpperCase(),
        orderId: topUpId,
      };
      const transaction = await transactionRepository.create(
        transactionData as Transaction
      );

      const parameter = {
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: topUpId,
          gross_amount: transaction.amount,
        },
        bank_transfer: {
          bank: data.bankCode.toLowerCase(),
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
        item_details: [
          {
            id: transaction.id,
            price: transaction.amount,
            quantity: 1,
            name: "Top Up Balance",
          },
        ],
      };

      const charge = await midtrans.charge(parameter);

      const va_number =
        charge.va_numbers?.[0]?.va_number ||
        charge.permata_va_number ||
        charge.bill_key ||
        null;

      await transactionRepository.updateTransaction(transaction.id, {
        vaNumber: va_number,
      });

      return {
        status: true,
        status_code: 201,
        message: "VA generated successfully",
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          VA: va_number,
          status: transaction.status,
          bank: data.bankCode,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error: " + error.message,
        data: null,
      };
    }
  }

  async TopUpQris(data: { userId: string; amount: number }) {
    try {
      const user = await userRepository.findById(data.userId);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const topUpId = `TOPUP-QRIS-${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      const transactionData: Partial<Transaction> = {
        userId: data.userId,
        amount: data.amount,
        type: "TOPUP",
        status: "PENDING",
        bankCode: "QRIS",
        orderId: topUpId,
      };

      const transaction = await transactionRepository.create(
        transactionData as Transaction
      );

      const parameter = {
        payment_type: "qris",
        transaction_details: {
          order_id: topUpId,
          gross_amount: transaction.amount,
        },
        qris: {
          acquirer: "gopay",
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
        item_details: [
          {
            id: transaction.id,
            price: transaction.amount,
            quantity: 1,
            name: "Top Up via QRIS",
          },
        ],
      };

      const charge = await midtrans.charge(parameter);

      const qrUrl =
        charge.actions?.find((a: any) => a.name === "generate-qr-code")?.url ||
        null;

      await transactionRepository.updateTransaction(transaction.id, {
        qrisUrl: qrUrl,
      });

      return {
        status: true,
        status_code: 201,
        message: "QRIS generated successfully",
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          qrUrl,
          status: transaction.status,
          bank: "QRIS",
        },
      };
    } catch (error: any) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error: " + error.message,
        data: null,
      };
    }
  }

  async TopUpRetail(data: {
    userId: string;
    amount: number;
    store: "alfamart" | "indomaret";
  }) {
    try {
      const user = await userRepository.findById(data.userId);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const topUpId = `TOPUP-RETAIL-${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      const transactionData: Partial<Transaction> = {
        userId: data.userId,
        amount: data.amount,
        type: "TOPUP",
        status: "PENDING",
        bankCode: data.store.toUpperCase(),
        orderId: topUpId,
      };

      const transaction = await transactionRepository.create(
        transactionData as Transaction
      );

      const parameter = {
        payment_type: "cstore",
        transaction_details: {
          order_id: topUpId,
          gross_amount: transaction.amount,
        },
        cstore: {
          store: data.store,
          message: "Pembayaran Top Up Saldo",
          customer_name: user.name,
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
        item_details: [
          {
            id: transaction.id,
            price: transaction.amount,
            quantity: 1,
            name: `Top Up via ${data.store}`,
          },
        ],
      };

      const charge = await midtrans.charge(parameter);

      const paymentCode = charge.payment_code || null;

      await transactionRepository.updateTransaction(transaction.id, {
        paymentCode,
      });

      return {
        status: true,
        status_code: 201,
        message: `${data.store} payment code generated successfully`,
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          paymentCode,
          status: transaction.status,
          store: data.store,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error: " + error.message,
        data: null,
      };
    }
  }

  async midtransCallback(payload: any) {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY!;
      const grossAmount = payload.gross_amount;

      const hash = crypto
        .createHash("sha512")
        .update(
          payload.order_id + payload.status_code + grossAmount + serverKey
        )
        .digest("hex");

      if (hash !== payload.signature_key) {
        return { status: false, message: "Invalid signature" };
      }

      const transaction = await transactionRepository.findByOrderId(
        payload.order_id
      );
      if (!transaction) {
        return { status: false, message: "Transaction not found" };
      }

      if (transaction.status === "SUCCESS") {
        return { status: true, message: "Already processed" };
      }

      const status = payload.transaction_status;

      if (["capture", "settlement"].includes(status)) {
        const settlement =
          await transactionRepository.processSuccessfulTransaction(transaction);

        await publisher.publish(
          "transactions-events",
          JSON.stringify({
            event: "transaction:success",
            payload: settlement.transactions,
          })
        );

        await publisher.publish(
          "notification-events",
          JSON.stringify({
            event: "notification:send",
            payload: settlement.notification,
          })
        );

        await publisher.publish(
          "points-events",
          JSON.stringify({
            event: "points:updated",
            payload: settlement.points,
          })
        );
        return {
          status: true,
          message: "Transaction successful",
        };
      }

      if (["cancel", "deny", "expire"].includes(status)) {
        const cancel = await transactionRepository.processFailedTransaction(
          transaction
        );

        await publisher.publish(
          "transactions-events",
          JSON.stringify({
            event: "transaction:cancel",
            payload: cancel,
          })
        );
        return { status: true, message: "Transaction failed" };
      }

      if (status === "pending") {
        await transactionRepository.updateStatus(transaction.id, "PENDING");
        return { status: true, message: "Transaction pending" };
      }

      return { status: false, message: "Unknown status" };
    } catch (error: any) {
      console.error(error);
      return { status: false, message: error.message };
    }
  }

  async findAllTransactions() {
    try {
      const transactions = await transactionRepository.findAll();
      return {
        status: true,
        status_code: 200,
        message: "Transactions retrieved successfully",
        data: transactions,
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
}
