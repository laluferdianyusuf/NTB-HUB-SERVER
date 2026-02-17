import { FindVenuesParams } from "./../types/venues.params";
import { Prisma, PrismaClient, Venue } from "@prisma/client";
const prisma = new PrismaClient();

export class VenueRepository {
  async createVenue(
    data: Venue,
    tx?: Prisma.TransactionClient,
  ): Promise<Venue> {
    const db = tx ?? prisma;
    return db.venue.create({ data });
  }

  async findAllVenues(params: FindVenuesParams = {}) {
    const {
      search,
      category = "all",
      subCategory = "all",
      skip = 0,
      take = 20,
    } = params;

    const where: any = {};

    if (search) {
      const words = search.split(" ");
      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          address: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          city: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: { name: { contains: word, mode: "insensitive" } },
            },
          },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: {
                category: { name: { contains: word, mode: "insensitive" } },
              },
            },
          },
        })),
      ];
    }

    if (category !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: {
            category: { id: category },
          },
        },
      };
    }

    if (subCategory !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: { id: subCategory },
        },
      };
    }

    return prisma.venue.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        services: {
          where: { isActive: true },
          include: {
            subCategory: {
              include: { category: true },
            },
          },
        },
      },
    });
  }

  async countVenues(params: Omit<FindVenuesParams, "skip" | "take"> = {}) {
    const { search, category = "all", subCategory = "all" } = params;

    const where: any = {};

    if (search) {
      const words = search.split(" ");
      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          address: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          city: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: { name: { contains: word, mode: "insensitive" } },
            },
          },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: {
                category: { name: { contains: word, mode: "insensitive" } },
              },
            },
          },
        })),
      ];
    }

    if (category !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: {
            category: { id: category },
          },
        },
      };
    }

    if (subCategory !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: { id: subCategory },
        },
      };
    }

    return prisma.venue.count({ where });
  }

  async findPopularVenues(params: FindVenuesParams = {}) {
    const {
      search,
      category = "all",
      subCategory = "all",
      skip = 0,
      take = 10,
    } = params;

    const where: any = { isActive: true };

    if (search) {
      const words = search.split(" ");
      where.OR = [
        ...words.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          address: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          city: { contains: word, mode: "insensitive" },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: { name: { contains: word, mode: "insensitive" } },
            },
          },
        })),
        ...words.map((word) => ({
          services: {
            some: {
              isActive: true,
              subCategory: {
                category: { name: { contains: word, mode: "insensitive" } },
              },
            },
          },
        })),
      ];
    }

    if (category !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: {
            category: { id: category },
          },
        },
      };
    }

    if (subCategory !== "all") {
      where.services = {
        some: {
          isActive: true,
          subCategory: { id: subCategory },
        },
      };
    }

    return prisma.venue.findMany({
      where,
      skip,
      take,
      orderBy: {
        impressions: {
          _count: "desc",
        },
      },
      include: {
        services: {
          where: { isActive: true },
          include: {
            subCategory: {
              include: { category: true },
            },
          },
        },
      },
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
