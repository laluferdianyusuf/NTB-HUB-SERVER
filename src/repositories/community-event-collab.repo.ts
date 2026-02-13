import { Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityEventCollaborationRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  add(
    eventId: string,
    communityId: string,
    role = "CO_HOST",
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEventCollaboration.create({
      data: { eventId, communityId, role },
    });
  }

  bulkAdd(
    eventId: string,
    communityIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEventCollaboration.createMany({
      data: communityIds.map((id) => ({
        eventId,
        communityId: id,
      })),
      skipDuplicates: true,
    });
  }

  listByEvent(eventId: string) {
    return prisma.communityEventCollaboration.findMany({
      where: { eventId },
      include: { community: true },
    });
  }
}
