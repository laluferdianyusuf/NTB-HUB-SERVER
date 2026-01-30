import { Review } from "@prisma/client";
import {
  ReviewRepository,
  VenueRepository,
  BookingRepository,
} from "repositories";
import { uploadImage } from "utils/uploadS3";
const reviewRepository = new ReviewRepository();
const venueRepository = new VenueRepository();
const bookingRepository = new BookingRepository();

export class ReviewServices {
  async createReview(data: any, file?: Express.Multer.File) {
    const { bookingId, rating, comment, userId } = data;

    let imageUrl: string | null = null;

    if (file && file.path) {
      const image = await uploadImage({ file, folder: "reviews" });
      imageUrl = image.url;
    }

    const existingReview = await reviewRepository.findByBookingId(bookingId);

    if (existingReview) {
      throw new Error("You have already submitted a review for this booking");
    }

    return reviewRepository.create(
      {
        bookingId,
        rating: Number(rating),
        comment,
        image: imageUrl,
      } as Review,
      userId,
    );
  }

  async getReviewById(id: string) {
    try {
      const review = await reviewRepository.findById(id);

      if (!review) {
        return {
          status: false,
          status_code: 404,
          message: "Review not found",
          data: null,
        };
      }
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getReviewByBookingId(bookingId: string) {
    const review = await reviewRepository.findByBookingId(bookingId);

    return review;
  }

  async getVenueRating(venueId: string) {
    const reviews = await reviewRepository.findManyByVenueId(venueId);

    if (reviews.length === 0) {
      return {
        rating: 0,
        totalReviews: 0,
        reviewers: [],
      };
    }

    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
      rating: Number(average.toFixed(2)),
      totalReviews: reviews.length,
      reviewers: reviews,
    };
  }
}
