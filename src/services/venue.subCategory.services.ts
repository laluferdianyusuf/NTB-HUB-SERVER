import { VenueSubCategoryRepository } from "../repositories";
import { VenueCategoryRepository } from "../repositories";

export class VenueSubCategoryService {
  private venueCategoryRepository = new VenueCategoryRepository();
  private venueSubCategoryRepository = new VenueSubCategoryRepository();

  async create(input: {
    categoryId: string;
    name: string;
    code: string;
    description?: string;
    defaultConfig: Record<string, any>;
  }) {
    const code = input.code.toUpperCase().trim();

    const category = await this.venueCategoryRepository.findById(
      input.categoryId
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
}
