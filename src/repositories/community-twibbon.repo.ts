import { prisma } from "config/prisma";
import { Prisma } from "@prisma/client";

export class CommunityTwibbonRepository {
  findActiveByCommunity(communityId: string) {
    return prisma.communityTwibbon.findMany({
      where: {
        communityId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: Prisma.CommunityTwibbonCreateInput) {
    return prisma.communityTwibbon.create({ data });
  }

  update(id: string, data: Prisma.CommunityTwibbonUpdateInput) {
    return prisma.communityTwibbon.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.communityTwibbon.delete({ where: { id } });
  }
}
