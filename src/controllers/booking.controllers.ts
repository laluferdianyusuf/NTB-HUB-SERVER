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

  async processBookingPayment(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.updateBookingPayment(id);

      if (this.io && result.data) {
        this.io.emit("booking:payment", result.data);
      }
      res.status(result.status_code).json(result);
    } catch (error) {
      res.status(500).json("Internal server error");
    }
  }

  async cancelBooking(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.bookingService.cancelBooking(id);

      if (this.io && result.status_code === 200) {
        this.io.emit("booking:canceled", result.data);
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
      const result = await this.bookingService.cancelBooking(id);

      if (this.io && result.status_code === 200) {
        this.io.emit("booking:complete", result.data);
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
