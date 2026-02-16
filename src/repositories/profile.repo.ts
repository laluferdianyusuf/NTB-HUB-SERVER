import { prisma } from "config/prisma";

export class ProfileRepository {
  async hasViewedToday(profileId: string, viewerId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return prisma.profileView.findFirst({
      where: {
        profileId,
        viewerId,
        createdAt: { gte: start },
      },
    });
  }

  createView(profileId: string, viewerId?: string) {
    return prisma.profileView.create({
      data: { profileId, viewerId },
    });
  }

  incrementViewCounter(profileId: string) {
    return prisma.user.update({
      where: { id: profileId },
      data: { profileViewCount: { increment: 1 } },
    });
  }

  async like(profileId: string, userId: string) {
    return prisma.$transaction([
      prisma.profileLike.create({
        data: { profileId, userId },
      }),
      prisma.user.update({
        where: { id: profileId },
        data: { profileLikeCount: { increment: 1 } },
      }),
    ]);
  }

  async unlike(profileId: string, userId: string) {
    return prisma.$transaction([
      prisma.profileLike.delete({
        where: {
          profileId_userId: { profileId, userId },
        },
      }),
      prisma.user.update({
        where: { id: profileId },
        data: { profileLikeCount: { decrement: 1 } },
      }),
    ]);
  }

  isLiked(profileId: string, userId: string) {
    return prisma.profileLike.findUnique({
      where: {
        profileId_userId: { profileId, userId },
      },
    });
  }
}
