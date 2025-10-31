import { Request, Response } from "express";
import { BookingServices } from "../services/booking.services";
import { Server } from "socket.io";

export class BookingControllers {
  private bookingService: BookingServices;
  private io?: Server;

  constructor(io?: Server) {
    this.bookingService = new BookingServices();
    this.io = io;
  }
  async createBooking(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.bookingService.createBooking(data);

      if (this.io && result.status_code == 201) {
        this.io.emit("booking:new", result.data);
      }

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

  async cancelBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id, "CANCELLED");

      if (this.io && result.status_code === 200) {
        this.io.emit("booking:update", { id, status: "CANCELLED" });
      }

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
      const result = await this.bookingService.cancelBooking(id, "COMPLETED");

      if (this.io && result.status_code === 200) {
        this.io.emit("booking:update", { id, status: "COMPLETED" });
      }

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
