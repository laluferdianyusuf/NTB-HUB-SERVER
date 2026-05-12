import { prisma } from "../config/prisma";

export class InterestRepository {
  async getAllInterests() {
    return prisma.interest.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  async getUserInterests(userId: string) {
    return prisma.userInterest.findMany({
      where: {
        userId,
      },
      include: {
        interest: true,
      },
    });
  }

  async removeAllUserInterests(userId: string) {
    return prisma.userInterest.deleteMany({
      where: {
        userId,
      },
    });
  }

  async addUserInterests(userId: string, interestIds: string[]) {
    return prisma.userInterest.createMany({
      data: interestIds.map((interestId) => ({
        userId,
        interestId,
      })),
      skipDuplicates: true,
    });
  }

  async validateInterestIds(ids: string[]) {
    return prisma.interest.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
