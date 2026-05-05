import { Account, AccountType, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

interface CreateAccountPayload {
  type: AccountType;
  userId?: string;
  venueId?: string;
  eventId?: string;
  communityId?: string;
  courierId?: string;
  id?: string;
}

export class AccountRepository {
  async createAccount(
    payload: CreateAccountPayload,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.account.create({
      data: {
        ...payload,
      },
    });
  }

  async upsertByUser(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.account.upsert({
      where: { userId },
      update: {},
      create: {
        user: {
          connect: { id: userId },
        },
        type: "USER",
      },
    });
  }

  async upsertByVenue(venueId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.upsert({
      where: { venueId },
      update: {},
      create: {
        venue: {
          connect: { id: venueId },
        },
        type: "VENUE",
      },
    });
  }

  async upsertByEvent(eventId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.account.upsert({
      where: { eventId },
      update: {},
      create: {
        event: {
          connect: { id: eventId },
        },
        type: "EVENT",
      },
    });
  }

  async upsertByCommunity(communityId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    return client.account.upsert({
      where: { communityId },
      update: {},
      create: {
        community: {
          connect: { id: communityId },
        },
        type: "COMMUNITY",
      },
    });
  }

  async upsertByCourier(courierId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.upsert({
      where: { courierId },
      update: {},
      create: {
        courier: {
          connect: { id: courierId },
        },
        type: "COURIER",
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.findUnique({
      where: {
        id,
      },
    });
  }

  async resolveAccountOwner(account: Account) {
    if (account.venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: account.venueId },
        select: { name: true },
      });

      return { name: venue?.name, type: "VENUE" };
    }

    if (account.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: account.eventId },
        select: { name: true },
      });

      return { name: event?.name, type: "EVENT" };
    }

    if (account.communityId) {
      const community = await prisma.community.findUnique({
        where: { id: account.communityId },
        select: { name: true },
      });

      return { name: community?.name, type: "COMMUNITY" };
    }

    if (account.courierId) {
      return { name: "Courier", type: "COURIER" };
    }

    if (account.userId) {
      const user = await prisma.user.findUnique({
        where: { id: account.userId },
        select: { name: true },
      });

      return { name: user?.name, type: "USER" };
    }

    return { name: "Unknown", type: "UNKNOWN" };
  }

  async findUserAccount(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.findFirst({
      where: {
        userId,
        type: "USER",
      },
    });
  }

  async findVenueAccount(venueId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.findFirst({
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

  async findPlatformAccount(tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.findFirst({
      where: {
        id: "platform-main-account",
        type: "PLATFORM",
      },
    });
  }
}
