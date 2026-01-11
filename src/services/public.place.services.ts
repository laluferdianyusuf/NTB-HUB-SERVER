import { PublicPlaceRepository } from "../repositories";
import { PublicPlace, PublicPlaceType } from "@prisma/client";

export class PublicPlaceService {
  private repo = new PublicPlaceRepository();

  getAll(type?: PublicPlaceType): Promise<PublicPlace[]> {
    return this.repo.findAll(type);
  }

  async getDetail(id: string): Promise<PublicPlace> {
    const place = await this.repo.findById(id);

    if (!place || !place.isActive) {
      throw new Error("PUBLIC_PLACE_NOT_FOUND");
    }

    return place;
  }

  create(data: PublicPlace): Promise<PublicPlace> {
    return this.repo.create({
      ...data,
      gallery: data.gallery ?? [],
      isActive: true,
    });
  }

  update(id: string, data: PublicPlace): Promise<PublicPlace> {
    return this.repo.update(id, data);
  }

  deactivate(id: string): Promise<PublicPlace> {
    return this.repo.deactivate(id);
  }
}
