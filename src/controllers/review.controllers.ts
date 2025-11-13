import { ReviewServices } from "services";
import { Request, Response } from "express";

export class ReviewControllers {
  private reviewService: ReviewServices;

  constructor() {
    this.reviewService = new ReviewServices();
  }

  async createReview(req: Request, res: Response) {
    const data = req.body;
    const result = await this.reviewService.createReview(data, req.file);

    res.status(result.status_code).json(result);
  }

  async getVenueRating(req: Request, res: Response) {
    const venueId = req.params.venueId;
    const result = await this.reviewService.getVenueRating(venueId);
    res.status(result.status_code).json(result);
  }
}
