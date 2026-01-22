import { Request, Response } from "express";
import { BookingServices } from "../services/booking.services";

export class BookingControllers {
  private bookingService: BookingServices;

  constructor() {
    this.bookingService = new BookingServices();
  }
  async createBooking(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.bookingService.createBooking(data);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getAllBookings(req: Request, res: Response) {
    try {
      const result = await this.bookingService.getAllBookings();

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getBookingById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.getBookingById(id);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getBookingByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.bookingService.getBookingByUserId(userId);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getBookingPaidByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.bookingService.getBookingPaidByUserId(userId);

      res.status(200).json({
        status: true,
        message: "Booking found",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async getBookingPendingByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result =
        await this.bookingService.getBookingPendingByUserId(userId);

      res.status(200).json({
        status: true,
        message: "Booking found",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async processBookingPayment(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.updateBookingPayment(id);

      res.status(result.status_code).json(result);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  }

  async cancelBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async completeBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id);

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getExistingBooking(req: Request, res: Response) {
    try {
      const { serviceId, unitId, startTime, endTime } = req.query;
      const result = await this.bookingService.getExistingBooking(
        String(serviceId),
        String(unitId),
        new Date(String(startTime)),
        new Date(String(endTime)),
      );

      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }
}
