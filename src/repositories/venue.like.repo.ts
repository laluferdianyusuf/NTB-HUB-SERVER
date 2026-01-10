import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueLikeRepository {
  async likeVenue(venueId: string, userId: string) {
    const existingLike = await prisma.likeVenue.findUnique({
      where: {
        userId_venueId: {
          userId,
          venueId,
        },
      },
    });

    if (existingLike) {
      await prisma.likeVenue.delete({
        where: {
          id: existingLike.id,
        },
      });
    }

    return await prisma.likeVenue.create({
      data: {
        userId,
        venueId,
      },
    });
  }

  async countLikesByVenueId(venueId: string): Promise<number> {
    return prisma.likeVenue.count({
      where: { venueId },
    });
  }

  async isLikedByUser(venueId: string, userId: string): Promise<boolean> {
    const like = await prisma.likeVenue.findFirst({
      where: {
        venueId,
        userId,
      },
    });

    return !!like;
  }
}
