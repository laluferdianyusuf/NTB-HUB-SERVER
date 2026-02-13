import { Prisma, CommunityMember } from "@prisma/client";
import { prisma } from "config/prisma";

interface Pagination {
  skip?: number;
  take?: number;
}

export class CommunityMemberRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async addMember(
    data: Prisma.CommunityMemberCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember> {
    const client = this.transaction(tx);
    return client.communityMember.create({ data });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember | null> {
    const client = this.transaction(tx);
    return client.communityMember.findUnique({ where: { id } });
  }

  async findByCommunityAndUser(
    communityId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember | null> {
    const client = this.transaction(tx);
    return client.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });
  }

  async findByCommunity(
    communityId: string,
    options: Pagination = {},
    search?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);

    const where: any = { communityId };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          user: {
            name: {
              contains: word,
              mode: "insensitive",
            },
          },
        })),
      ];
    }

    return client.communityMember.findMany({
      where: where,
      skip: options.skip,
      take: options.take,
      orderBy: { joinedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.CommunityMemberUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember> {
    const client = this.transaction(tx);
    return client.communityMember.update({ where: { id }, data });
  }

  async remove(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember> {
    const client = this.transaction(tx);
    return client.communityMember.delete({ where: { id } });
  }

  async findByUserAndCommunity(
    userId: string,
    communityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CommunityMember | null> {
    const client = this.transaction(tx);
    return client.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
  }
}
