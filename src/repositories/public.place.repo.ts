import { PrismaClient, PublicPlace, PublicPlaceType } from "@prisma/client";

const prisma = new PrismaClient();

export class PublicPlaceRepository {
  findAll(params: {
    type?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { type = "all", search, skip = 0, take = 10 } = params;
    const where: any = {
      isActive: true,
    };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          address: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    if (type !== "all") {
      where.type = type;
    }

    return prisma.publicPlace.findMany({
      where,
      skip,
      take,
      include: {
        reviews: true,
        likes: true,
        impressions: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async countPublicPaces(
    params: Omit<{ type?: string; search?: string }, "skip" | "take"> = {},
  ) {
    const { search, type = "all" } = params;

    const where: any = {
      isActive: true,
    };

    if (search) {
      const words = search.split(" ");

      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          address: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          description: { contains: word, mode: "insensitive" },
        })),
      ];
    }

    if (type !== "all") {
      where.type = type;
    }

    return prisma.publicPlace.count({ where });
  }

  findById(id: string): Promise<PublicPlace | null> {
    return prisma.publicPlace.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        likes: true,
        impressions: true,
      },
    });
  }

  create(
    data: Omit<PublicPlace, "id" | "createdAt" | "updatedAt">,
  ): Promise<PublicPlace> {
    return prisma.publicPlace.create({ data });
  }

  update(id: string, data: Partial<PublicPlace>): Promise<PublicPlace> {
    return prisma.publicPlace.update({
      where: { id },
      data,
    });
  }

  deactivate(id: string): Promise<PublicPlace> {
    return prisma.publicPlace.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
