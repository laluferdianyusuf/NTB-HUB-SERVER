import crypto from "crypto";
import { PaymentRepository } from "../repositories/payment.repo";
import { BookingRepository } from "../repositories/booking.repo";
import { UserRepository } from "../repositories/user.repo";
import { Payment } from "@prisma/client";
import { midtrans } from "config/midtrans.config"; 

const paymentRepository = new PaymentRepository();
const bookingRepository = new BookingRepository();
const userRepository = new UserRepository();

function isValidSignature(data: any, serverKey: string): boolean {
  const input =
    data.order_id + data.status_code + data.gross_amount + serverKey;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(input)
    .digest("hex");

  return expectedSignature === data.signature_key;
}

export class PaymentServices {
  async createPayment(data: Payment & { bank: string }) {
    try {
      const booking = await bookingRepository.findBookingById(data.bookingId);
      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const user = await userRepository.findById(data.userId);
      if (!user) {
        return { status: false, status_code: 404, message: "User not found" };
      }

      const existing = await paymentRepository.findPaymentFirst({
        bookingId: booking.id,
      });
      if (existing && existing.status !== "CANCELLED") {
        return {
          status: false,
          status_code: 400,
          message: "Active payment already exists",
        };
      }

      const orderId = `BOOK-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      const parameter = {
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: orderId,
          gross_amount: booking.totalPrice,
        },
        bank_transfer: {
          bank: data.bank.toLowerCase(),
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
        item_details: [
          {
            id: booking.venueId,
            price: booking.totalPrice,
            quantity: 1,
            name: "Venue Booking",
          },
        ],
      };

      const transaction = await midtrans.charge(parameter);

      const va_number =
        transaction.va_numbers?.[0]?.va_number ||
        transaction.permata_va_number ||
        transaction.bill_key ||
        null;

      const created = await paymentRepository.createPayments({
        bookingId: booking.id,
        userId: user.id,
        orderId,
        transactionId: transaction.transaction_id,
        paymentType: data.bank.toUpperCase(),
        amount: booking.totalPrice,
        status: "PENDING",
        vaNumber: va_number,
      } as Payment);

      await bookingRepository.updateBooking(created.bookingId, created.id);

      return {
        status: true,
        status_code: 201,
        message: "Payment created successfully",
        data: {
          ...created,
          bank: data.bank.toUpperCase(),
          va_number,
          amount: booking.totalPrice,
          status: "PENDING",
        },
      };
    } catch (error: any) {
      console.error("Payment creation error:", error);
      return {
        status: false,
        status_code: 500,
        message: error.message || "Internal server error",
      };
    }
  }

  async createPaymentCallback(data: any) {
    try {
      if (!data || Object.keys(data).length === 0) {
        return {
          status: false,
          status_code: 400,
          message: "Invalid callback payload",
          data: null,
        };
      }

      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        transaction_id,
        payment_type,
        transaction_time,
        settlement_time,
        fraud_status,
        va_numbers,
      } = data;

      // if (!isValidSignature(data, process.env.MIDTRANS_SERVER_KEY)) {
      //   console.warn("Invalid Midtrans signature!");
      //   return {
      //     status: false,
      //     status_code: 403,
      //     message: "Invalid signature",
      //     data: null,
      //   };
      // }

      const payment = await paymentRepository.findPaymentFirst({
        orderId: order_id,
      });
      if (!payment) {
        return {
          status: false,
          status_code: 404,
          message: "Payment record not found",
          data: null,
        };
      }
      const payload = {
        status: transaction_status.toUpperCase(),
        paymentType: payment_type,
        transactionTime: transaction_time ? new Date(transaction_time) : null,
        settlementTime: settlement_time ? new Date(settlement_time) : null,
        vaNumber: va_numbers?.[0]?.va_number || null,
        fraudStatus: fraud_status || null,
      };

      const updatedPayment = await paymentRepository.updatePayments(
        payment.id,
        payload
      );

      if (["settlement", "capture"].includes(transaction_status)) {
        await bookingRepository.updateBookingStatus(
          payment.bookingId,
          "COMPLETED"
        );
      }

      if (["cancel", "expire", "deny"].includes(transaction_status)) {
        await bookingRepository.updateBookingStatus(
          payment.bookingId,
          "CANCELLED"
        );
      }

      console.log("Midtrans callback processed:", {
        order_id,
        status: transaction_status,
        va: va_numbers?.[0]?.va_number,
      });

      return {
        status: true,
        status_code: 200,
        message: "Callback processed successfully",
        data: updatedPayment,
      };
    } catch (error: any) {
      console.error("Callback error:", error);
      return {
        status: false,
        status_code: 500,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  async getAllPayments() {
    try {
      const payments = await paymentRepository.findAllPayments();
      return {
        status: true,
        status_code: 200,
        message: "Payments retrieved successfully",
        data: payments,
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

  async getPaymentById(id: string) {
    try {
      const payment = await paymentRepository.findPaymentById(id);
      if (!payment) {
        return {
          status: false,
          status_code: 404,
          message: "Payment not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Payment found",
        data: payment,
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
}
