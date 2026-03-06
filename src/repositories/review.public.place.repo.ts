import { Prisma, PrismaClient, ReviewPublicPlace } from "@prisma/client";
const prisma = new PrismaClient();

export interface CreateReviewPublicPlaceDTO {
  placeId: string;
  rating: number;
  comment?: string | null;
  image?: string | null;
}

export class ReviewPublicPlaceRepository {
  async create(
    data: Prisma.ReviewPublicPlaceCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.reviewPublicPlace.create({
      data,
    });
  }

  async aggregateByPlace(placeId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.reviewPublicPlace.aggregate({
      where: { placeId },
      _avg: { rating: true },
      _count: { rating: true },
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

  async findByPlaceUserId(
    userId: string,
    placeId: string,
  ): Promise<ReviewPublicPlace | null> {
    return prisma.reviewPublicPlace.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
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
