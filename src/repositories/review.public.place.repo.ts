import { Prisma, PrismaClient, ReviewPublicPlace } from "@prisma/client";
const prisma = new PrismaClient();

export interface CreateReviewPublicPlaceDTO {
  placeId: string;
  rating: number;
  comment?: string | null;
  image?: string | null;
}

export class ReviewPublicPlaceRepository {
  async create(data: CreateReviewPublicPlaceDTO, userId: string) {
    return prisma.$transaction(async (tx) => {
      const reviewData: Prisma.ReviewPublicPlaceCreateInput = {
        rating: data.rating,
        comment: data.comment ?? null,
        image: data.image ?? null,
        user: {
          connect: { id: userId },
        },
        place: {
          connect: { id: data.placeId },
        },
      };

      const review = await tx.reviewPublicPlace.create({
        data: reviewData,
      });

      await tx.point.create({
        data: {
          userId,
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
