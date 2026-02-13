import { TaskEntityType, TaskType } from "@prisma/client";
import { prisma } from "config/prisma";

export class TaskRepository {
  create(data: {
    entityType: TaskEntityType;
    entityId: string;
    communityId?: string;
    title: string;
    description?: string;
    type: TaskType;
    rule: any;
    startAt?: Date;
    endAt?: Date;
  }) {
    return prisma.task.create({ data });
  }

  findById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
    });
  }

  findAllOrByEntity(params?: {
    entityType?: TaskEntityType;
    entityId?: string;
  }) {
    return prisma.task.findMany({
      where: {
        isActive: true,
        deletedAt: null,

        ...(params?.entityType && {
          entityType: params.entityType,
        }),

        ...(params?.entityId && {
          entityId: params.entityId,
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  deactivate(taskId: string) {
    return prisma.task.update({
      where: { id: taskId },
      data: { isActive: false },
    });
  }
}
