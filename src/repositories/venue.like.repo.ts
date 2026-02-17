import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueLikeRepository {
  async likeVenue(venueId: string, userId: string) {
    return await prisma.$transaction([
      prisma.likeVenue.create({
        data: {
          userId,
          venueId,
        },
      }),
      prisma.venue.update({
        where: { id: venueId },
        data: { totalLikes: { increment: 1 } },
      }),
    ]);
  }

  async unlikeVenue(venueId: string, userId: string) {
    return await prisma.$transaction([
      prisma.likeVenue.delete({
        where: {
          userId_venueId: { userId, venueId },
        },
      }),
      prisma.venue.update({
        where: { id: venueId },
        data: { totalLikes: { decrement: 1 } },
      }),
    ]);
  }

  async countLikesByVenueId(venueId: string): Promise<number> {
    return prisma.likeVenue.count({
      where: { venueId },
    });
  }

  async isLikedByUser(venueId: string, userId: string): Promise<boolean> {
    console.log(venueId, userId);
    const like = await prisma.likeVenue.findUnique({
      where: {
        userId_venueId: { userId, venueId },
      },
    });

    return !!like;
  }
}
