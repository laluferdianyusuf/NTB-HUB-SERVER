import { prisma } from "config/prisma";

export class PresenceRepository {
  upsert(userId: string, context: string, contextId?: string) {
    return prisma.userPresenceSnapshot.upsert({
      where: { id: `${userId}:${context}:${contextId ?? "global"}` },
      update: { lastSeen: new Date() },
      create: {
        id: `${userId}:${context}:${contextId ?? "global"}`,
        userId,
        context,
        contextId,
        lastSeen: new Date(),
      },
    });
  }

  list(context: string, contextId?: string) {
    return prisma.userPresenceSnapshot.findMany({
      where: { context, contextId },
    });
  }
}
