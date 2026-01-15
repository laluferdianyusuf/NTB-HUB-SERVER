import { VenueCategoryRepository } from "../repositories";
import { VenueCategory } from "@prisma/client";

export class VenueCategoryService {
  private venueCategoryRepository = new VenueCategoryRepository();
  async create(input: {
    name: string;
    code: string;
    icon?: string;
  }): Promise<VenueCategory> {
    const code = input.code.toUpperCase().trim();

    const existing = await this.venueCategoryRepository.findByCode(code);
    if (existing) {
      throw new Error("Venue category code already exists");
    }

    return this.venueCategoryRepository.create({
      name: input.name.trim(),
      code,
      icon: input.icon,
    });
  }

  async getAll() {
    return this.venueCategoryRepository.findAll();
  }
}
