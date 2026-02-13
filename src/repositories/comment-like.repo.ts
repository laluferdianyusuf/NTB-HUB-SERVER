import { prisma } from "config/prisma";

export class CommentLikeRepository {
  async toggle(commentId: string, userId: string) {
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
      return false;
    }

    await prisma.commentLike.create({ data: { commentId, userId } });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
    });

    return true;
  }
}
