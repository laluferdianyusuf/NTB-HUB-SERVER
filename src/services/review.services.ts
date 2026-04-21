import { prisma } from "config/prisma";
import {
  BookingRepository,
  ReviewRepository,
  VenueRepository,
} from "repositories";
import { uploadImage } from "utils/uploadS3";
const reviewRepository = new ReviewRepository();
const venueRepository = new VenueRepository();
const bookingRepository = new BookingRepository();

export class ReviewServices {
  async createReview(
    data: { bookingId: string; rating: number; comment?: string },
    file?: Express.Multer.File,
  ) {
    const { bookingId, rating, comment } = data;

    let imageUrl: string | null = null;

    if (file && file.path) {
      const image = await uploadImage({ file, folder: "reviews" });
      imageUrl = image.url;
    }

    return prisma.$transaction(async (tx) => {
      const booking = await bookingRepository.findBookingById(bookingId, tx);

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.review) {
        throw new Error("Review already exists");
      }

      if (booking.status !== "COMPLETED") {
        throw new Error("Cannot review uncompleted booking");
      }

      const review = await reviewRepository.create(
        {
          rating: Number(rating),
          comment,
          image: imageUrl,
          booking: { connect: { id: bookingId } },
        },
        tx,
      );

      const aggregation = await reviewRepository.aggregateByVenue(
        booking.venueId,
        tx,
      );

      await venueRepository.updateRating(
        booking.venueId,
        aggregation._avg.rating ?? 0,
        aggregation._count.rating,
        tx,
      );

      return review;
    });
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
