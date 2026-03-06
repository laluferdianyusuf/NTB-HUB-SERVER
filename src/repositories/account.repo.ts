import { prisma } from "config/prisma";

export class AccountRepository {
  async findUserAccount(userId: string) {
    return prisma.account.findFirst({
      where: {
        userId,
        type: "USER",
      },
    });
  }

  async findVenueAccount(venueId: string) {
    return prisma.account.findFirst({
      where: {
        venueId,
        type: "VENUE",
      },
    });
  }

  async findEventAccount(eventId: string) {
    return prisma.account.findFirst({
      where: {
        eventId,
        type: "EVENT",
      },
    });
  }

  async findCommunityAccount(communityId: string) {
    return prisma.account.findFirst({
      where: {
        communityId,
        type: "COMMUNITY",
      },
    });
  }

  async findCourierAccount(courierId: string) {
    return prisma.account.findFirst({
      where: {
        courierId,
        type: "COURIER",
      },
    });
  }

  async findPlatformAccount() {
    return prisma.account.findFirst({
      where: {
        id: "platform-main-account",
        type: "PLATFORM",
      },
    });
  }
}
