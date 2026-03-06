import { ReviewPublicPlace } from "@prisma/client";
import { prisma } from "config/prisma";
import { toNum } from "helpers/parser";
import {
  PointsRepository,
  PublicPlaceRepository,
  ReviewPublicPlaceRepository,
  TaskExecutionRepository,
  TaskRepository,
} from "repositories";
import { TaskRule } from "types/task";
import { uploadImage } from "utils/uploadS3";

const reviewPlaceRepository = new ReviewPublicPlaceRepository();
const placeRepository = new PublicPlaceRepository();
const taskRepository = new TaskRepository();
const taskExecRepository = new TaskExecutionRepository();
const pointRepository = new PointsRepository();

export class ReviewPublicPlaceServices {
  async createPlaceReview(
    data: ReviewPublicPlace,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const { placeId, rating, comment } = data;

    let imageUrl: string | null = null;

    if (file && file.path) {
      const image = await uploadImage({ file, folder: "place_reviews" });
      imageUrl = image.url;
    }

    const existingReview = await reviewPlaceRepository.findByPlaceUserId(
      userId,
      placeId,
    );

    if (existingReview) {
      throw new Error("You have already submitted a review for this place");
    }

    return prisma.$transaction(async (tx) => {
      const review = await reviewPlaceRepository.create(
        {
          rating: toNum(rating) as number,
          comment: comment ?? null,
          image: imageUrl ?? null,
          user: { connect: { id: userId } },
          place: { connect: { id: placeId } },
        },
        tx,
      );

      const aggregation = await reviewPlaceRepository.aggregateByPlace(
        placeId,
        tx,
      );

      await placeRepository.updateRating(
        placeId,
        aggregation._avg.rating ?? 0,
        aggregation._count.rating,
        tx,
      );

      const task = await taskRepository.findByEntity(
        "PUBLIC_PLACE",
        placeId,
        "RATE_PLACE",
        tx,
      );

      if (task) {
        const rule = task.rule as TaskRule;
        const reward = rule.reward?.points ?? 0;

        const existingExecution = await taskExecRepository.findUserExecution(
          task.id,
          userId,
          tx,
        );

        if (!existingExecution) {
          const execution = await taskExecRepository.create(
            {
              taskId: task.id,
              userId,
            },
            tx,
          );

          await taskExecRepository.complete(execution.id, tx);

          if (reward > 0) {
            await pointRepository.generatePoints(
              {
                userId,
                activity: "REVIEW",
                points: reward,
                reference: review.id,
              },
              tx,
            );
          }
        }
      }

      return review;
    });
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
