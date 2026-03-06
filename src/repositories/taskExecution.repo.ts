import { Prisma, TaskExecutionStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export class TaskExecutionRepository {
  findUserExecution(
    taskId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.taskExecution.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });
  }

  create(
    data: {
      taskId: string;
      userId: string;
      qrSessionId?: string;
      latitude?: number;
      longitude?: number;
      proof?: any;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.taskExecution.create({ data });
  }

  complete(executionId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.taskExecution.update({
      where: { id: executionId },
      data: {
        status: TaskExecutionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}
