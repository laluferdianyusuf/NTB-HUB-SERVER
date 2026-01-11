import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PublicPlaceLikeRepository {
  async likePublicPlace(placeId: string, userId: string) {
    const existingLike = await prisma.likePublicPlace.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    });

    if (existingLike) {
      await prisma.likePublicPlace.delete({
        where: {
          id: existingLike.id,
        },
      });
    }

    return await prisma.likePublicPlace.create({
      data: {
        userId,
        placeId,
      },
    });
  }

  async countLikesByPlaceId(placeId: string): Promise<number> {
    return prisma.likePublicPlace.count({
      where: { placeId },
    });
  }

  async isLikedByUser(placeId: string, userId: string): Promise<boolean> {
    const like = await prisma.likePublicPlace.findFirst({
      where: {
        placeId,
        userId,
      },
    });

    return !!like;
  }
}
