import { TaskExecutionStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export class TaskExecutionRepository {
  findUserExecution(taskId: string, userId: string) {
    return prisma.taskExecution.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });
  }

  create(data: {
    taskId: string;
    userId: string;
    qrSessionId?: string;
    latitude?: number;
    longitude?: number;
    proof?: any;
  }) {
    return prisma.taskExecution.create({ data });
  }

  complete(executionId: string) {
    return prisma.taskExecution.update({
      where: { id: executionId },
      data: {
        status: TaskExecutionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}
