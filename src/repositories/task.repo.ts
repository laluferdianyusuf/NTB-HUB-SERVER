import { Prisma, TaskEntityType, TaskType } from "@prisma/client";
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
    requiresQr?: boolean;
    requiresGeo?: boolean;
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

  findByEntity(
    entityType: TaskEntityType,
    entityId: string,
    type: TaskType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.task.findFirst({
      where: {
        entityType,
        entityId,
        type,
        isActive: true,
      },
    });
  }

  findAllWithUserStatus(userId: string, communityId?: string) {
    return prisma.task.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { communityId: null },

          {
            ...(communityId ? { communityId } : {}),

            community: {
              members: {
                some: {
                  userId,
                  status: "APPROVED",
                },
              },
            },
          },
        ],
      },
      include: {
        community: {
          select: {
            name: true,
          },
        },
        executions: {
          where: { userId },
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
        taskQrSessions: {
          select: {
            id: true,
            token: true,
            expiresAt: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findAll() {
    return prisma.task.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        community: {
          select: {
            name: true,
          },
        },
        executions: {
          select: {
            id: true,
            userId: true,
            status: true,
            completedAt: true,
          },
        },
        taskQrSessions: {
          select: {
            id: true,
            token: true,
            expiresAt: true,
            isActive: true,
          },
        },
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
