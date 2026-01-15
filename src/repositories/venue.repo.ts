import { PrismaClient, Venue } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueRepository {
  async findAllVenue(): Promise<Venue[]> {
    return await prisma.venue.findMany();
  }

  async findVenueById(id: string) {
    return await prisma.venue.findUnique({
      where: { id },
      include: {
        invitation: true,
        operationalHours: true,
        services: {
          where: { isActive: true },
          include: {
            units: { where: { isActive: true } },
          },
        },
      },
    });
  }

  async activateVenue(id: string) {
    return await prisma.venue.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async updateVenue(id: string, data: Partial<Venue>): Promise<Venue> {
    return await prisma.$transaction(async (tx) => {
      const existingFloor = await tx.floor.findFirst({
        where: { venueId: id },
      });

      let updatedVenue: Venue;

      if (existingFloor) {
        updatedVenue = await tx.venue.update({
          where: { id },
          data,
        });
      } else {
        updatedVenue = await tx.venue.update({
          where: { id },
          data,
        });

        await tx.floor.create({
          data: {
            name: "Floor 1",
            venueId: id,
            level: 1,
          },
        });
      }

      return updatedVenue;
    });
  }

  async deleteVenueWithRelations(id: string): Promise<Venue> {
    return await prisma.$transaction(async (tx) => {
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
