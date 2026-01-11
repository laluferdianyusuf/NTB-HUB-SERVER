import { PrismaClient, PublicPlace, PublicPlaceType } from "@prisma/client";

const prisma = new PrismaClient();

export class PublicPlaceRepository {
  findAll(type?: PublicPlaceType): Promise<PublicPlace[]> {
    return prisma.publicPlace.findMany({
      where: {
        isActive: true,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
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
    data: Omit<PublicPlace, "id" | "createdAt" | "updatedAt">
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
