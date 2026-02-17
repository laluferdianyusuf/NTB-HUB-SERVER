import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PublicPlaceLikeRepository {
  async likePublicPlace(placeId: string, userId: string) {
    return await prisma.$transaction([
      prisma.likePublicPlace.create({
        data: {
          userId,
          placeId,
        },
      }),
      prisma.publicPlace.update({
        where: { id: placeId },
        data: {
          totalLikes: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  async unlikePublicPlace(placeId: string, userId: string) {
    return await prisma.$transaction([
      prisma.likePublicPlace.delete({
        where: {
          userId_placeId: { userId, placeId },
        },
      }),
      prisma.publicPlace.update({
        where: { id: placeId },
        data: {
          totalLikes: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  async countLikesByPlaceId(placeId: string): Promise<number> {
    return prisma.likePublicPlace.count({
      where: { placeId },
    });
  }

  async isLikedByUser(placeId: string, userId: string) {
    return await prisma.likePublicPlace.findUnique({
      where: {
        userId_placeId: { userId, placeId },
      },
    });
  }
}
