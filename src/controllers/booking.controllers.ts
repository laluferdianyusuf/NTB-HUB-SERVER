import { Request, Response } from "express";
import { BookingServices } from "../services/booking.services";
import { sendError, sendSuccess } from "helpers/response";

export class BookingControllers {
  private bookingService: BookingServices;

  constructor() {
    this.bookingService = new BookingServices();
  }
  async createBooking(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.bookingService.createBooking(data);

      sendSuccess(res, result, "Booking created successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getAllBookings(req: Request, res: Response) {
    try {
      const result = await this.bookingService.getAllBookings();

      sendSuccess(res, result, "booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getBookingById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.getBookingById(id);

      sendSuccess(res, result, "booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getBookingByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.bookingService.getBookingByUserId(userId);

      sendSuccess(res, result, "Booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getBookingByVenueId(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await this.bookingService.getBookingByVenueId(venueId);

      sendSuccess(res, result, "Booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getBookingPaidByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.bookingService.getBookingPaidByUserId(userId);

      sendSuccess(res, result, "Booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }
  async getBookingPendingByUserId(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result =
        await this.bookingService.getBookingPendingByUserId(userId);

      sendSuccess(res, result, "Booking retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async processBookingPayment(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.updateBookingPayment(id);

      sendSuccess(res, result, "booking retrieved successfully", 201);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  }

  async cancelBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id);

      sendSuccess(res, result, "booking retrieved successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async completeBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id);

      sendSuccess(res, result, "booking retrieved successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
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

      sendSuccess(res, result, "booking retrieved successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }
}
