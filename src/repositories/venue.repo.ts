import { Prisma, PrismaClient, Venue } from "@prisma/client";
import { FindVenuesParams } from "../types/venues.params";

const prisma = new PrismaClient();

export class VenueRepository {
  async createVenue(
    data: Venue,
    tx?: Prisma.TransactionClient,
  ): Promise<Venue> {
    const client = tx ?? prisma;

    const venue = await client.venue.create({
      data,
    });

    await client.account.create({
      data: {
        type: "VENUE",
        venueId: venue.id,
      },
    });

    return venue;
  }
  private buildVenueWhere(
    params: FindVenuesParams = {},
    activeOnly = false,
  ): Prisma.VenueWhereInput {
    const { search, category = "all", subCategory = "all" } = params;

    const where: Prisma.VenueWhereInput = {};
    const andConditions: Prisma.VenueWhereInput[] = [];

    if (activeOnly) {
      where.isActive = true;
    }

    // ======================================================
    // SEARCH
    // ======================================================
    if (search?.trim()) {
      const words = search.trim().split(/\s+/);

      const orConditions: Prisma.VenueWhereInput[] = [];

      for (const word of words) {
        orConditions.push(
          {
            name: {
              contains: word,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            address: {
              contains: word,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            city: {
              contains: word,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            services: {
              some: {
                isActive: true,
                subCategory: {
                  name: {
                    contains: word,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          },
          {
            services: {
              some: {
                isActive: true,
                subCategory: {
                  category: {
                    name: {
                      contains: word,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            },
          },
        );
      }

      andConditions.push({
        OR: orConditions,
      });
    }

    // ======================================================
    // CATEGORY + SUBCATEGORY
    // ======================================================
    if (category !== "all" || subCategory !== "all") {
      const subCategoryFilter: any = {};

      if (category !== "all") {
        subCategoryFilter.category = {
          id: category,
        };
      }

      if (subCategory !== "all") {
        subCategoryFilter.id = subCategory;
      }

      andConditions.push({
        services: {
          some: {
            isActive: true,
            subCategory: subCategoryFilter,
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  async findAllVenues(params: FindVenuesParams = {}) {
    const { skip = 0, take = 20 } = params;

    const where = this.buildVenueWhere(params);

    return prisma.venue.findMany({
      where,
      skip,
      take,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        services: {
          where: {
            isActive: true,
          },
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

  async countVenues(params: Omit<FindVenuesParams, "skip" | "take"> = {}) {
    const where = this.buildVenueWhere(params);

    return prisma.venue.count({
      where,
    });
  }

  async findPopularVenues(params: FindVenuesParams = {}) {
    const { skip = 0, take = 10 } = params;

    const where = this.buildVenueWhere(params, true);

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
          where: {
            isActive: true,
          },
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

  async findByIds(ids: string[]) {
    return prisma.venue.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async updateRating(
    venueId: string,
    averageRating: number,
    totalReviews: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.venue.update({
      where: {
        id: venueId,
      },
      data: {
        averageRating,
        totalReviews,
      },
    });
  }

  async findActiveVenue(): Promise<Venue[]> {
    return prisma.venue.findMany({
      where: {
        isActive: true,
      },
      include: {
        services: {
          where: {
            isActive: true,
          },
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
    return prisma.venue.findUnique({
      where: {
        id,
      },
      include: {
        invitation: true,
        operationalHours: true,
        services: {
          where: {
            isActive: true,
          },
          include: {
            units: {
              where: {
                isActive: true,
              },
            },
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

  async findVenueLikedByUser(userId: string) {
    return prisma.venue.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: {
        invitation: true,
        operationalHours: true,
        services: {
          where: {
            isActive: true,
          },
          include: {
            units: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  async activateVenue(id: string) {
    return prisma.venue.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
  }

  async updateVenue(id: string, data: Partial<Venue>): Promise<Venue> {
    return prisma.$transaction(async (tx) => {
      const existingFloor = await tx.floor.findFirst({
        where: {
          venueId: id,
        },
      });

      const updatedVenue = await tx.venue.update({
        where: {
          id,
        },
        data,
      });

      if (!existingFloor) {
        await tx.floor.create({
          data: {
            name: "Floor 1",
            level: 1,
            venueId: id,
          },
        });
      }

      return updatedVenue;
    });
  }

  async deleteVenueWithRelations(id: string): Promise<Venue> {
    return prisma.$transaction(async (tx) => {
      await tx.invitationKey.deleteMany({
        where: {
          venueId: id,
        },
      });

      await tx.venueBalance.deleteMany({
        where: {
          venueId: id,
        },
      });

      return tx.venue.delete({
        where: {
          id,
        },
      });
    });
  }
}
