import { PrismaClient, Prisma, Community } from "@prisma/client";
import { prisma } from "config/prisma";

interface FindAllOptions {
  skip?: number;
  take?: number;
  search?: string;
}

export class CommunityRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createCommunity(
    data: Prisma.CommunityCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Community> {
    const client = this.transaction(tx);
    return client.community.create({ data });
  }

  async findById(
    id: string,

    tx?: Prisma.TransactionClient,
  ): Promise<Community | null> {
    const client = this.transaction(tx);
    return client.community.findUnique({
      where: { id },
      include: {
        members: true,
        posts: { include: { reactions: true } },
      },
    });
  }

  async findAllCommunity(
    options: FindAllOptions = {},
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    const { skip = 0, take = 20, search } = options;

    const where: any = {};

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }
    return client.community.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          select: { userId: true, status: true, role: true },
        },
      },
    });
  }

  async updateCommunity(
    id: string,
    data: Prisma.CommunityUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Community> {
    const client = this.transaction(tx);
    return client.community.update({ where: { id }, data });
  }

  async deleteCommunity(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Community> {
    const client = this.transaction(tx);
    return client.community.delete({ where: { id } });
  }
}
