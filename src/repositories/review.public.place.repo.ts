import { PrismaClient, ReviewPublicPlace } from "@prisma/client";
const prisma = new PrismaClient();

export class ReviewPublicPlaceRepository {
  async create(
    data: ReviewPublicPlace,
    userId: string,
  ): Promise<ReviewPublicPlace> {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.reviewPublicPlace.create({ data });

      await tx.point.create({
        data: {
          userId: userId,
          points: 10,
          activity: "REVIEW",
          reference: review.id,
        },
      });
      return review;
    });
  }

  async findById(id: string): Promise<ReviewPublicPlace | null> {
    return prisma.reviewPublicPlace.findUnique({ where: { id } });
  }

  async findAll(): Promise<ReviewPublicPlace[]> {
    return prisma.reviewPublicPlace.findMany();
  }

  async findByPlaceId(placeId: string): Promise<ReviewPublicPlace | null> {
    return prisma.reviewPublicPlace.findFirst({
      where: { placeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
        place: true,
      },
    });
  }

  async findManyByPlaceId(placeId: string): Promise<ReviewPublicPlace[]> {
    return prisma.reviewPublicPlace.findMany({
      where: {
        placeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });
  }
}
