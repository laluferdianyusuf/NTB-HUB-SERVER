import { Review } from "@prisma/client";
import {
  ReviewRepository,
  VenueRepository,
  BookingRepository,
} from "repositories";
const reviewRepository = new ReviewRepository();
const venueRepository = new VenueRepository();
const bookingRepository = new BookingRepository();

export class ReviewServices {
  async createReview(data: Review) {
    try {
      const booking = await bookingRepository.findBookingById(data.bookingId);

      if (!booking) {
        return {
          status: false,
          status_code: 404,
          message: "Booking not found",
          data: null,
        };
      }

      const existingReview = await reviewRepository.findByBookingId(
        data.bookingId
      );
      if (existingReview) {
        return {
          status: false,
          status_code: 400,
          message: "You have already submitted a review for this booking",
          data: null,
        };
      }

      const review = await reviewRepository.create(data, booking);

      return {
        status: true,
        status_code: 201,
        message: "Review created successfully",
        data: review,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
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

  async getVenueRating(venueId: string) {
    try {
      const venue = await venueRepository.findVenueById(venueId);

      if (!venue) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      const rating = await reviewRepository.getVenueRating(venueId);
      return {
        status: true,
        status_code: 200,
        message: "Venue retrieved",
        data: rating,
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
