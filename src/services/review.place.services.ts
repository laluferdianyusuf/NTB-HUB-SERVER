import { ReviewPublicPlace } from "@prisma/client";
import { ReviewPublicPlaceRepository } from "repositories";
import { uploadImage } from "utils/uploadS3";
const reviewPlaceRepository = new ReviewPublicPlaceRepository();

export class ReviewPublicPlaceServices {
  async createPlaceReview(data: ReviewPublicPlace, file?: Express.Multer.File) {
    const { placeId, rating, comment, userId } = data;

    let imageUrl: string | null = null;

    if (file && file.path) {
      const image = await uploadImage({ file, folder: "place_reviews" });
      imageUrl = image.url;
    }

    const existingReview = await reviewPlaceRepository.findByPlaceId(placeId);

    if (existingReview) {
      throw new Error("You have already submitted a review for this place");
    }

    return reviewPlaceRepository.create(
      {
        placeId,
        rating: Number(rating),
        comment,
        image: imageUrl,
      } as ReviewPublicPlace,
      userId,
    );
  }

  async getReviewPlaceById(id: string) {
    const review = await reviewPlaceRepository.findById(id);

    if (!review) {
      throw new Error("No reviews found for this place");
    }
  }

  async getPlaceRating(placeId: string) {
    const reviews = await reviewPlaceRepository.findManyByPlaceId(placeId);

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
