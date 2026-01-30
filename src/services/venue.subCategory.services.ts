import { BookingType } from "@prisma/client";
import { VenueSubCategoryRepository } from "../repositories";
import { VenueCategoryRepository } from "../repositories";

type ServiceConfig = {
  sections?: {
    schedule?: boolean;
    units?: boolean;
    menu?: boolean;
  };

  durationStepMinutes?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;

  sessions?: Array<{
    id: string;
    label: string;
    start: string;
    end: string;
    price?: number;
    quota?: number;
  }>;
};
export class VenueSubCategoryService {
  private venueCategoryRepository = new VenueCategoryRepository();
  private venueSubCategoryRepository = new VenueSubCategoryRepository();

  async create(input: {
    categoryId: string;
    name: string;
    code: string;
    description?: string;
    defaultConfig: ServiceConfig;
  }) {
    const code = input.code.toUpperCase().trim();

    const category = await this.venueCategoryRepository.findById(
      input.categoryId,
    );
    if (!category || !category.isActive) {
      throw new Error("Venue category not found or inactive");
    }

    const duplicate = await this.venueCategoryRepository.findByCode(code);
    if (duplicate) {
      throw new Error("Venue sub category code already exists");
    }

    return this.venueSubCategoryRepository.create({
      categoryId: input.categoryId,
      name: input.name.trim(),
      code,
      description: input.description,
      defaultConfig: input.defaultConfig,
    });
  }

  async getByCategory(categoryId: string) {
    return this.venueSubCategoryRepository.findByCategory(categoryId);
  }

  async getAllSubCategory() {
    return this.venueSubCategoryRepository.findAll();
  }

  async createMany(
    categoryId: string,
    items: Array<{
      name: string;
      code: string;
      description?: string;
      defaultConfig: ServiceConfig;
    }>,
  ) {
    if (!items || items.length === 0) {
      throw new Error("Items cannot be empty");
    }

    return this.venueSubCategoryRepository.createMany(categoryId, items);
  }
}
