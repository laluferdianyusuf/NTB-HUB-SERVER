import { Booking } from "@prisma/client";
import {
  BookingRepository,
  UserBalanceRepository,
  TableRepository,
} from "../repositories";
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const tableRepository = new TableRepository();
export class BookingServices {
  async createBooking(data: Booking) {
    try {
      const invoiceNumber = `INV-${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}`;

      const existingBooking = await bookingRepository.existingBooking(
        data.tableId,
        data.startTime,
        data.endTime
      );

      if (existingBooking) {
        return {
          status: false,
          status_code: 400,
          message: "Booking exist",
          data: null,
        };
      }

      const tables = await tableRepository.findTablesById(data.tableId);

      if (!tables) {
        return {
          status: false,
          status_code: 404,
          message: "Table not found",
          data: null,
        };
      } else if (tables.status === "BOOKED") {
        return {
          status: false,
          status_code: 400,
          message: "This table is booked",
          data: null,
        };
      } else if (tables.status === "MAINTENANCE") {
        return {
          status: false,
          status_code: 400,
          message: "This table is under maintenance",
          data: null,
        };
      }

      const createBooking = await bookingRepository.createBooking(
        data,
        invoiceNumber
      );
      return {
        status: true,
        status_code: 201,
        message: "Booking created successfully",
        data: createBooking,
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

  async updateBookingPayment(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);
      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      if (booking.status === "PAID") {
        return {
          status: false,
          status_code: 400,
          message: `This book already paid`,
          data: null,
        };
      }

      const balance = await userBalanceRepository.getBalanceByUserId(
        booking.userId
      );

      const paymentId = `PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

      if (!balance || balance < booking.totalPrice) {
        return {
          status: false,
          status_code: 400,
          message: "Insufficient balance",
          data: null,
        };
      }
      const payments = await bookingRepository.processBookingPayment(
        booking,
        paymentId,
        10
      );

      return {
        status: true,
        status_code: 200,
        message: "Booking payment processed successfully",
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

  async getAllBookings() {
    try {
      await bookingRepository.resetExpiredBookings();
      const booking = await bookingRepository.findAllBooking();
      return {
        status: true,
        status_code: 200,
        message: "Booking retrieved",
        data: booking,
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

  async getBookingById(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "booking not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Booking founded",
        data: booking,
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

  async getBookingByUserId(userId: string) {
    try {
      const booking = await bookingRepository.findBookingByUserId(userId);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "booking not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Booking founded",
        data: booking,
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

  async cancelBooking(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const updated = await bookingRepository.cancelBooking(id);

      return {
        status: true,
        status_code: 200,
        message: "Booking canceled",
        data: updated,
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

  async completeBooking(id: string) {
    try {
      const booking = await bookingRepository.findBookingById(id);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const updated = await bookingRepository.completeBooking(id);

      return {
        status: true,
        status_code: 200,
        message: "Booking completed",
        data: updated,
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
