import { PrismaClient, Prisma, VenueSubCategory } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueSubCategoryRepository {
  create(data: {
    categoryId: string;
    name: string;
    code: string;
    description?: string;
    defaultConfig?: Prisma.JsonObject;
  }) {
    return prisma.venueSubCategory.create({
      data: {
        ...data,
        defaultConfig: data.defaultConfig ?? {},
      },
    });
  }

  findById(id: string) {
    return prisma.venueSubCategory.findUnique({
      where: { id },
    });
  }

  findAll(): Promise<VenueSubCategory[]> {
    return prisma.venueSubCategory.findMany();
  }

  findByCode(code: string) {
    return prisma.venueSubCategory.findUnique({
      where: { code },
    });
  }

  findByCategory(categoryId: string) {
    return prisma.venueSubCategory.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string;
      defaultConfig?: Prisma.JsonObject;
      isActive?: boolean;
    }
  ) {
    return prisma.venueSubCategory.update({
      where: { id },
      data,
    });
  }

  deactivate(id: string) {
    return prisma.venueSubCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
