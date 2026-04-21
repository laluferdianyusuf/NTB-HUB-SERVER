import { AccountType, Prisma } from "@prisma/client";
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

  async upsertByUser(userId: string, tx?: any) {
    return (tx || prisma).account.upsert({
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

  async upsertByVenue(venueId: string, tx?: any) {
    return (tx || prisma).account.upsert({
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

  async upsertByEvent(eventId: string, tx?: any) {
    return (tx || prisma).account.upsert({
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

  async upsertByCommunity(communityId: string, tx?: any) {
    return (tx || prisma).account.upsert({
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

  async upsertByCourier(courierId: string, tx?: any) {
    return (tx || prisma).account.upsert({
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

  async findUserAccount(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.account.findFirst({
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
