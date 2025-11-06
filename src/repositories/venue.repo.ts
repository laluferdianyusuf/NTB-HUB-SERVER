import { PrismaClient, Venue } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueRepository {
  async findAllVenue(): Promise<Venue[]> {
    return await prisma.venue.findMany();
  }

  async findVenueById(id: string): Promise<Venue | null> {
    return prisma.venue.findUnique({
      where: { id },
      include: { invitation: true },
    });
  }

  async createVenue(data: Venue): Promise<Venue> {
    return prisma.venue.create({
      data: {
        name: data.name ?? "Untitled Venue",
        address: data.address ?? "",
        description: data.description ?? "",
        type: data.type ?? "UNKNOWN",
      },
    });
  }

  async updateVenue(id: string, data: Partial<Venue>): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data,
    });
  }

  async deleteVenueWithRelations(id: string): Promise<Venue> {
    return prisma.$transaction(async (tx) => {
      await tx.invitationKey.deleteMany({
        where: { venueId: id },
      });

      await tx.venueBalance.deleteMany({
        where: { venueId: id },
      });

      const deletedVenue = await tx.venue.delete({
        where: { id },
      });

      return deletedVenue;
    });
  }
}
