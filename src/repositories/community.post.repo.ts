import { PrismaClient, Prisma, CommunityPost } from "@prisma/client";
import { prisma } from "config/prisma";

interface Pagination {
  skip?: number;
  take?: number;
}

export class CommunityPostRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: Prisma.CommunityPostCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityPost> {
    const client = this.transaction(tx);
    return client.communityPost.create({ data });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityPost | null> {
    const client = this.transaction(tx);
    return client.communityPost.findUnique({ where: { id } });
  }

  async findByCommunity(
    communityId: string,
    options: Pagination = {},
    search?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityPost[]> {
    const client = this.transaction(tx);

    const where: any = { communityId };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          content: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          link: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    return client.communityPost.findMany({
      where: where,
      skip: options.skip,
      take: options.take,
      include: {
        reactions: true,
        admin: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(
    id: string,
    data: Prisma.CommunityPostUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityPost> {
    const client = this.transaction(tx);
    return client.communityPost.update({ where: { id }, data });
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityPost> {
    const client = this.transaction(tx);
    return client.communityPost.delete({ where: { id } });
  }
}
