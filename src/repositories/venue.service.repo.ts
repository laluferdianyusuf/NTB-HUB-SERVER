import { BookingType, PrismaClient, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueServiceRepository {
  create(data: {
    venueId: string;
    subCategoryId: string;
    bookingType?: BookingType;
    unitType?: UnitType;
    config: Record<string, any>;
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
        units: true,
      },
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
    });
  }

  update(
    id: string,
    data: {
      bookingType?: BookingType;
      unitType?: UnitType;
      config?: Record<string, any>;
      isActive?: boolean;
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
      data: { isActive: false },
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
}
