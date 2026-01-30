import { ReviewPublicPlaceServices, ReviewServices } from "services";
import { Request, Response } from "express";

export class ReviewPlaceControllers {
  private reviewService: ReviewPublicPlaceServices;

  constructor() {
    this.reviewService = new ReviewPublicPlaceServices();
  }

  async createReview(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.reviewService.createPlaceReview(data, req.file);
      res.status(201).json({
        status: true,
        message: "Rating successful",
        data: result,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getReviewById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await this.reviewService.getReviewPlaceById(id);
      res.status(200).json({
        status: true,
        message: "Rating retrieved successful",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getPlaceRating(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId;
      const result = await this.reviewService.getPlaceRating(placeId);
      res.status(200).json({
        status: true,
        message: "Rating retrieved successful",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
