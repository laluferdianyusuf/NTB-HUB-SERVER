import { prisma } from "config/prisma";
import { Prisma } from "@prisma/client";

export class CommunityEventRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }
  findCommunityEvents(
    params: {
      search?: string;
      skip?: number;
      take?: number;
    } = {},
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    const { search, skip = 0, take = 10 } = params;

    const where: Prisma.CommunityEventWhereInput = {};

    if (search) {
      const words = search.split(" ");

      where.OR = words.flatMap((word) => [
        { title: { contains: word, mode: "insensitive" } },
        { location: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
      ]);
    }

    return db.communityEvent.findMany({
      where,
      orderBy: { startAt: "asc" },
      skip,
      take,
      include: {
        createdBy: {
          select: { id: true, name: true, photo: true },
        },
        community: {
          select: { id: true, name: true, image: true },
        },
      },
    });
  }

  findByCommunity(
    communityId: string,
    params: { skip?: number; take?: number } = {},
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEvent.findMany({
      where: { communityId },
      orderBy: { startAt: "asc" },
      skip: params.skip,
      take: params.take,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.communityEvent.findUnique({
      where: { id },
      include: {
        community: true,
        collaborations: true,
      },
    });
  }

  findByDateRange(communityId: string, start: Date, end: Date) {
    return prisma.communityEvent.findMany({
      where: {
        communityId,
        startAt: { gte: start, lte: end },
      },
      orderBy: { startAt: "asc" },
    });
  }

  create(
    data: Prisma.CommunityEventCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEvent.create({ data });
  }

  update(
    id: string,
    data: Prisma.CommunityEventUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.transaction(tx);
    return db.communityEvent.update({ where: { id }, data });
  }

  delete(id: string, tx?: Prisma.TransactionClient) {
    const db = this.transaction(tx);
    return db.communityEvent.delete({ where: { id } });
  }
}
