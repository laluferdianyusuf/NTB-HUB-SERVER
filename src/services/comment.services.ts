import { Comment, CommentEntityType } from "@prisma/client";
import {
  CommentRepository,
  CommentLikeRepository,
  CommentReportRepository,
} from "repositories";
import { AppError } from "helpers/AppError";
import { publishEvent } from "helpers/redisPubliser";

export class CommentService {
  private repo = new CommentRepository();
  private likeRepo = new CommentLikeRepository();
  private reportRepo = new CommentReportRepository();

  async list(entityType: CommentEntityType, entityId: string) {
    return this.repo.list(entityType, entityId);
  }

  async create(payload: Partial<Comment>) {
    if (!payload.userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!payload.content || payload.content.trim().length === 0) {
      throw new AppError("Comment cannot be empty", 400);
    }

    const comment = await this.repo.create(payload);

    publishEvent("comment-events", "comment:created", {
      comment,
      entityType: comment.entityType,
      entityId: comment.entityId,
    });

    return comment;
  }

  async like(commentId: string, userId: string) {
    const comment = await this.repo.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    if (comment.userId === userId) {
      throw new AppError("Cannot like your own comment", 400);
    }

    const liked = await this.likeRepo.toggle(commentId, userId);

    publishEvent("comment-events", "comment:liked", {
      commentId,
      userId,
      liked,
    });

    return liked;
  }

  async report(commentId: string, userId: string, reason: string) {
    const comment = await this.repo.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    const alreadyReported = await this.reportRepo.exists(commentId, userId);

    if (alreadyReported) {
      throw new AppError("Already reported", 409);
    }

    const report = await this.reportRepo.report(commentId, userId, reason);

    publishEvent("comment-events", "comment:reported", {
      commentId,
      userId,
      reason,
    });

    return report;
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.repo.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    if (comment.userId !== userId) {
      throw new AppError("Forbidden", 403);
    }

    await this.repo.softDelete(commentId);

    publishEvent("comment-events", "comment:deleted", {
      commentId,
      entityType: comment.entityType,
      entityId: comment.entityId,
    });

    return true;
  }
}
