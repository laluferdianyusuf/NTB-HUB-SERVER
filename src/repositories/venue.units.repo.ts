import { PrismaClient, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueUnitRepository {
  create(data: {
    venueId: string;
    serviceId: string;
    floorId: string;
    name: string;
    price: number;
    type: UnitType;
    isActive?: boolean;
  }) {
    return prisma.venueUnit.create({
      data,
    });
  }

  findById(id: string) {
    return prisma.venueUnit.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            subCategory: true,
          },
        },
      },
    });
  }

  findByService(serviceId: string) {
    return prisma.venueUnit.findMany({
      where: {
        serviceId,
        isActive: true,
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
        service: true,
      },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      price?: number;
      type?: UnitType;
      isActive?: boolean;
    }
  ) {
    return prisma.venueUnit.update({
      where: { id },
      data,
    });
  }

  deactivate(id: string) {
    return prisma.venueUnit.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
