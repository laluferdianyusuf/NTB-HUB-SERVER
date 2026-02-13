import { Prisma, CommunityPostMention } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityPostMentionRepository {
  private client(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createMany(
    postId: string,
    userIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!userIds.length) return;

    await this.client(tx).communityPostMention.createMany({
      data: userIds.map((userId) => ({
        postId,
        userId,
      })),
      skipDuplicates: true, // safety
    });
  }

  async findByPostId(postId: string) {
    return prisma.communityPostMention.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
      },
    });
  }

  async findPostsMentioningUser(userId: string) {
    return prisma.communityPostMention.findMany({
      where: { userId },
      include: {
        post: true,
      },
    });
  }
}
