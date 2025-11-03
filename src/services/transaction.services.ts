import crypto from "crypto";
import {
  Point,
  Transaction,
  TransactionStatus,
  UserBalance,
} from "@prisma/client";
import {
  TransactionRepository,
  PointsRepository,
  UserBalanceRepository,
  UserRepository,
} from "../repositories";
import { midtrans } from "config/midtrans.config";

const transactionRepository = new TransactionRepository();
const pointRepository = new PointsRepository();
const userBalanceRepository = new UserBalanceRepository();
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

      await pointRepository.generatePoints({
        userId: data.userId,
        points: Math.floor(data.amount / 100),
        activity: "TOPUP",
        reference: transaction.id,
      } as Point);

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

  async midtransCallback(payload: any) {
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY!;
      const hash = crypto
        .createHash("sha512")
        .update(
          payload.order_id +
            payload.status_code +
            payload.gross_amount +
            serverKey
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

      let newStatus: TransactionStatus = transaction.status;

      if (payload.transaction_status === "settlement") {
        newStatus = "SUCCESS";
        await transactionRepository.updateTransaction(transaction.id, {
          status: newStatus,
        });

        const existingBalance = await userBalanceRepository.getBalanceByUserId(
          transaction.userId!
        );

        if (existingBalance) {
          await userBalanceRepository.updateBalance(
            transaction.userId!,
            transaction.amount
          );
        } else {
          await userBalanceRepository.createBalance({
            userId: transaction.userId!,
            balance: transaction.amount,
          } as UserBalance);
        }

        await pointRepository.generatePoints({
          userId: transaction.userId!,
          points: Math.floor(transaction.amount / 100),
          activity: "TOPUP",
          reference: transaction.id,
        } as Point);
      } else if (
        ["expire", "cancel", "deny"].includes(payload.transaction_status)
      ) {
        newStatus = "FAILED";
        await transactionRepository.updateTransaction(transaction.id, {
          status: newStatus,
        });
      }

      return { status: true, transaction };
    } catch (error: any) {
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
