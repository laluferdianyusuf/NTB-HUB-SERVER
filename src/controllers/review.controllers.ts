import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { ReviewServices } from "services";

export class ReviewControllers {
  private reviewService: ReviewServices;

  constructor() {
    this.reviewService = new ReviewServices();
  }

  async createReview(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.reviewService.createReview(data, req.file);
      sendSuccess(res, result, "Rating success");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal server error");
    }
  }

  async getReviewByBookingId(req: Request, res: Response) {
    try {
      const bookingId = req.params.bookingId;
      const result = await this.reviewService.getReviewByBookingId(bookingId);
      sendSuccess(res, result, "Rating retrieved successful");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async getVenueRating(req: Request, res: Response) {
    try {
      const venueId = req.params.venueId;
      const result = await this.reviewService.getVenueRating(venueId);
      sendSuccess(res, result, "Rating retrieved successful");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }
}
