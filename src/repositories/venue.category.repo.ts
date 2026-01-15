import { PrismaClient, VenueCategory } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueCategoryRepository {
  create(data: { name: string; code: string; icon?: string }) {
    return prisma.venueCategory.create({ data });
  }

  findByCode(code: string): Promise<VenueCategory> {
    return prisma.venueCategory.findUnique({
      where: { code },
    });
  }

  findById(id: string): Promise<VenueCategory> {
    return prisma.venueCategory.findUnique({
      where: { id },
    });
  }

  findAll(): Promise<VenueCategory[]> {
    return prisma.venueCategory.findMany({
      where: { isActive: true },
      include: { subCategories: true },
    });
  }
}
