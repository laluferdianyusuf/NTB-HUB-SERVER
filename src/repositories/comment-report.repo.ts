import { prisma } from "config/prisma";

export class CommentReportRepository {
  async report(commentId: string, userId: string, reason: string) {
    await prisma.commentReport.create({
      data: { commentId, userId, reason },
    });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { reportCount: { increment: 1 } },
    });

    if (updated.reportCount >= 5) {
      await prisma.comment.update({
        where: { id: commentId },
        data: { isHidden: true },
      });
    }
  }

  exists(commentId: string, userId: string) {
    return prisma.commentReport.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });
  }
}
