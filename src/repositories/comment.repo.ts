import { Comment, CommentEntityType } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommentRepository {
  list(entityType: CommentEntityType, entityId: string) {
    return prisma.comment.findMany({
      where: {
        entityType,
        entityId,
        parentId: null,
        isDeleted: false,
      },
      include: {
        user: true,
        replies: {
          where: { isDeleted: false },
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: any) {
    return prisma.comment.create({ data });
  }

  findById(id: string) {
    return prisma.comment.findUnique({
      where: {
        id: id,
      },
    });
  }

  softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
