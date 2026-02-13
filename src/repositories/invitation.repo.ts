import { Prisma, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export class InvitationKeyRepository {
  private db(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async generateEvent(
    params: {
      email: string;
      key: string;
      role: Role;
      eventId: string;
      expiresAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.invitationKey.create({
      data: {
        email: params.email,
        key: params.key,
        role: params.role,

        eventId: params.eventId,
        venueId: null,
        communityId: null,

        expiresAt: params.expiresAt ?? null,
      },
    });
  }

  async generateVenue(
    params: {
      email: string;
      key: string;
      role: Role;
      venueId: string;
      expiresAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.invitationKey.create({
      data: {
        email: params.email,
        key: params.key,
        role: params.role,

        venueId: params.venueId,
        eventId: null,
        communityId: null,

        expiresAt: params.expiresAt ?? null,
      },
    });
  }

  async generateCommunity(
    params: {
      email: string;
      key: string;
      role: Role;
      communityId: string;
      expiresAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.invitationKey.create({
      data: {
        email: params.email,
        key: params.key,
        role: params.role,

        communityId: params.communityId,
        venueId: null,
        eventId: null,

        expiresAt: params.expiresAt ?? null,
      },
    });
  }

  async findByKey(key: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.invitationKey.findUnique({
      where: { key },
    });
  }

  async markUsed(id: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.invitationKey.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
