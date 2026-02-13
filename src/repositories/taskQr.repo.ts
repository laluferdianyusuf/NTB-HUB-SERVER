import { prisma } from "config/prisma";

export class TaskQrRepository {
  create(taskId: string, token: string, expiresAt: Date) {
    return prisma.taskQrSession.create({
      data: {
        taskId,
        token,
        expiresAt,
      },
    });
  }

  findValidSession(token: string) {
    return prisma.taskQrSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: { task: true },
    });
  }

  invalidate(sessionId: string) {
    return prisma.taskQrSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }
}
