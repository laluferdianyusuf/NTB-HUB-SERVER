import { prisma } from "config/prisma";

export class CommentLikeRepository {
  async likeComment(commentId: string, userId: string) {
    return await prisma.$transaction([
      prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  async unlikeComment(commentId: string, userId: string) {
    return await prisma.$transaction([
      prisma.commentLike.delete({
        where: {
          commentId_userId: { commentId, userId },
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  async isLikedByUser(commentId: string, userId: string) {
    return await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });
  }
}
