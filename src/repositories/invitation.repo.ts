import { PrismaClient, InvitationKey } from "@prisma/client";

const prisma = new PrismaClient();

export class InvitationKeyRepository {
  async generate(email: string, expiresAt?: Date, key?: string) {
    if (!email) {
      throw new Error("Email is required to generate an invitation key");
    }

    return await prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          name: `Venue not set`,
          type: "UNKNOWN",
          address: "Not set",
          description: "Auto-generated venue",
          isActive: false,
        },
      });
      const owners = await tx.owner.create({
        data: { venueId: venue.id, email, name: "Not set" } as any,
      });

      const generatedKey = key ?? crypto.randomUUID();

      const newKey = await tx.invitationKey.create({
        data: {
          venueId: venue.id,
          key: generatedKey,
          expiresAt: expiresAt ?? null,
        },
      });

      return { invitation: newKey, venue, owners };
    });
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
  async updateByVenueId(
    venueId: string,
    data: Partial<InvitationKey>
  ): Promise<InvitationKey> {
    return prisma.invitationKey.update({
      where: { venueId },
      data,
    });
  }
}
