import { PrismaClient, Prisma, CommunityReaction } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityReactionRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: { postId: string; userId: string; type: string },
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityReaction> {
    const client = this.transaction(tx);
    return client.communityReaction.create({ data });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityReaction | null> {
    const client = this.transaction(tx);
    return client.communityReaction.findUnique({ where: { id } });
  }

  async findByPost(
    postId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityReaction[]> {
    const client = this.transaction(tx);
    return client.communityReaction.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityReaction> {
    const client = this.transaction(tx);
    return client.communityReaction.delete({ where: { id } });
  }
}
