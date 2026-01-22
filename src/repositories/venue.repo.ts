import { PrismaClient, Venue } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueRepository {
  async findAllVenue(): Promise<Venue[]> {
    return await prisma.venue.findMany({
      include: {
        services: {
          where: { isActive: true },
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async findVenueByCategory(categoryId: string): Promise<Venue[]> {
    return await prisma.venue.findMany({
      where: {
        services: {
          some: {
            subCategory: {
              category: {
                id: categoryId,
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        services: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async findPopularVenueByCategory(categoryId: string): Promise<Venue[]> {
    return await prisma.venue.findMany({
      where: {
        services: {
          some: {
            subCategory: {
              category: {
                id: categoryId,
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            impressions: true,
          },
        },
      },
      orderBy: {
        impressions: {
          _count: "desc",
        },
      },
      take: 10,
    });
  }

  async findPopularVenues(): Promise<Venue[]> {
    return await prisma.venue.findMany({
      include: {
        _count: {
          select: {
            impressions: true,
          },
        },
      },
      orderBy: {
        impressions: {
          _count: "desc",
        },
      },
      take: 10,
    });
  }

  async findActiveVenue(): Promise<Venue[]> {
    return await prisma.venue.findMany({
      where: {
        isActive: true,
      },
      include: {
        services: {
          where: { isActive: true },
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
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

  async findVenueLikedByUser(userId: string) {
    return await prisma.venue.findMany({
      where: {
        likes: {
          some: { userId: userId },
        },
      },
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
