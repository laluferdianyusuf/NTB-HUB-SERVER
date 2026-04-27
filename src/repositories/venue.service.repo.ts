import { BookingType, Prisma, PrismaClient, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

type FindAllParams = {
  search?: string;
  isActive?: boolean;
  bookingType?: BookingType;
  unitType?: UnitType;
  skip?: number;
  take?: number;
};

export class VenueServiceRepository {
  create(data: {
    venueId: string;
    subCategoryId: string;
    bookingType?: BookingType;
    unitType?: UnitType;
    config: Record<string, any>;
    image?: string | null;
  }) {
    return prisma.venueService.create({
      data,
    });
  }

  findById(id: string) {
    return prisma.venueService.findUnique({
      where: { id },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
        units: true,
        menus: true,
      },
    });
  }

  findByVenue(venueId: string) {
    return prisma.venueService.findMany({
      where: {
        venueId,
        isActive: true,
      },
      include: {
        subCategory: true,
        units: {
          where: { isActive: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findAllService(venueId: string, params?: FindAllParams) {
    const where: Prisma.VenueServiceWhereInput = {
      venueId,
    };

    if (params?.search) {
      where.OR = [
        {
          subCategory: {
            name: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        },
        {
          subCategory: {
            code: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.bookingType) {
      where.bookingType = params.bookingType;
    }

    if (params?.unitType) {
      where.unitType = params.unitType;
    }

    return prisma.venueService.findMany({
      where,
      skip: params?.skip,
      take: params?.take,
      include: {
        subCategory: true,
        units: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  countAllService(venueId: string, params?: FindAllParams) {
    const where: Prisma.VenueServiceWhereInput = {
      venueId,
    };

    if (params?.search) {
      where.OR = [
        {
          subCategory: {
            name: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        },
        {
          subCategory: {
            code: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.bookingType) {
      where.bookingType = params.bookingType;
    }

    if (params?.unitType) {
      where.unitType = params.unitType;
    }

    return prisma.venueService.count({
      where,
    });
  }

  findBySubCategory(subCategoryId: string) {
    return prisma.venueService.findMany({
      where: {
        subCategoryId,
        isActive: true,
      },
      include: {
        venue: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  update(
    id: string,
    data: {
      bookingType?: BookingType;
      unitType?: UnitType;
      config?: Record<string, any>;
      isActive?: boolean;
      image?: string | null;
    },
  ) {
    return prisma.venueService.update({
      where: { id },
      data,
    });
  }

  deactivate(id: string) {
    return prisma.venueService.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  delete(id: string) {
    return prisma.venueService.delete({
      where: { id },
    });
  }

  findDuplicate(venueId: string, subCategoryId: string) {
    return prisma.venueService.findFirst({
      where: {
        venueId,
        subCategoryId,
      },
    });
  }

  async getSummary(venueId: string) {
    const [
      total,
      active,
      inactive,
      timeType,
      sessionType,
      fieldType,
      roomType,
    ] = await Promise.all([
      prisma.venueService.count({
        where: { venueId },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          isActive: true,
        },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          isActive: false,
        },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          bookingType: "TIME",
        },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          bookingType: "SESSION",
        },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          unitType: "FIELD",
        },
      }),

      prisma.venueService.count({
        where: {
          venueId,
          unitType: "ROOM",
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      timeType,
      sessionType,
      fieldType,
      roomType,
    };
  }
}
