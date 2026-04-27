import { Prisma, PrismaClient, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

type FindAllParams = {
  search?: string;
  serviceId?: string;
  floorId?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
};

export class VenueUnitRepository {
  create(data: {
    venueId: string;
    serviceId: string;
    name: string;
    price: number;
    type: UnitType;
    floorId?: string | null;
    isActive?: boolean;
  }) {
    return prisma.venueUnit.create({
      data,
    });
  }

  createMany(
    data: Array<{
      venueId: string;
      serviceId: string;
      name: string;
      price: number;
      type: UnitType;
      floorId?: string | null;
      isActive?: boolean;
    }>,
  ) {
    return prisma.venueUnit.createMany({
      data,
    });
  }

  findById(id: string) {
    return prisma.venueUnit.findUnique({
      where: { id },
      include: {
        floor: true,
        service: {
          include: {
            subCategory: true,
            venue: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  getUnitsWithBookings(
    venueId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
  ) {
    return prisma.venueUnit.findMany({
      where: {
        venueId,
        serviceId,
        isActive: true,
      },
      include: {
        booking: {
          where: {
            status: {
              in: ["PENDING", "PAID"],
            },
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
            invoice: {
              status: "PAID",
            },
          },
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  findByService(serviceId: string) {
    return prisma.venueUnit.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      include: {
        floor: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  findByVenue(venueId: string) {
    return prisma.venueUnit.findMany({
      where: {
        venueId,
        isActive: true,
      },
      include: {
        floor: true,
        service: {
          include: {
            subCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAll(venueId: string, params?: FindAllParams) {
    const where: Prisma.VenueUnitWhereInput = {
      venueId,
    };

    if (params?.serviceId) {
      where.serviceId = params.serviceId;
    }

    if (params?.floorId) {
      where.floorId = params.floorId;
    }

    if (typeof params?.isActive === "boolean") {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      where.OR = [
        {
          name: {
            contains: params.search,
            mode: "insensitive",
          },
        },
        {
          service: {
            subCategory: {
              name: {
                contains: params.search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.venueUnit.findMany({
        where,
        include: {
          floor: true,
          service: {
            include: {
              subCategory: true,
            },
          },
        },
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.venueUnit.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page:
          params?.skip && params?.take
            ? Math.floor(params.skip / params.take) + 1
            : 1,
        limit: params?.take ?? 20,
        totalPages: Math.ceil(total / (params?.take ?? 20)),
      },
    };
  }

  update(
    id: string,
    data: {
      name?: string;
      price?: number;
      type?: UnitType;
      floorId?: string | null;
      isActive?: boolean;
    },
  ) {
    return prisma.venueUnit.update({
      where: { id },
      data,
    });
  }

  toggleStatus(id: string, isActive: boolean) {
    return prisma.venueUnit.update({
      where: { id },
      data: {
        isActive,
      },
    });
  }

  deactivate(id: string) {
    return prisma.venueUnit.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  delete(id: string) {
    return prisma.venueUnit.delete({
      where: { id },
    });
  }

  countByVenue(venueId: string) {
    return prisma.venueUnit.count({
      where: {
        venueId,
      },
    });
  }

  countActiveByVenue(venueId: string) {
    return prisma.venueUnit.count({
      where: {
        venueId,
        isActive: true,
      },
    });
  }
}
