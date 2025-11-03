import { PrismaClient, InvitationKey } from "@prisma/client";

const prisma = new PrismaClient();

export class InvitationKeyRepository {
  async generate(
    venueId: string,
    expiresAt?: Date,
    key?: string
  ): Promise<InvitationKey> {
    const newKey = await prisma.invitationKey.create({
      data: {
        venueId,
        key,
        expiresAt: expiresAt ?? null,
      },
    });

    return newKey;
  }

  async findByKey(key: string): Promise<InvitationKey | null> {
    return prisma.invitationKey.findUnique({
      where: { key },
    });
  }

  async findByVenueId(venueId: string): Promise<InvitationKey | null> {
    return prisma.invitationKey.findUnique({
      where: { venueId },
    });
  }

  async deleteByVenueId(venueId: string): Promise<InvitationKey | null> {
    return prisma.invitationKey.delete({
      where: { venueId },
    });
  }

  async markAsUsed(key: string): Promise<InvitationKey> {
    const updatedKey = await prisma.invitationKey.update({
      where: { key },
      data: { usedAt: new Date() },
    });
    return updatedKey;
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.invitationKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  async findAll(): Promise<InvitationKey[]> {
    return prisma.invitationKey.findMany({
      include: {
        venue: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
