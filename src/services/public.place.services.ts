import {
  PublicPlaceImpressionRepository,
  PublicPlaceLikeRepository,
  PublicPlaceRepository,
} from "../repositories";
import { PublicPlace, PublicPlaceType } from "@prisma/client";

export class PublicPlaceService {
  private repo = new PublicPlaceRepository();
  private likeRepo = new PublicPlaceLikeRepository();
  private impressionRepo = new PublicPlaceImpressionRepository();

  async getAll(type?: PublicPlaceType): Promise<PublicPlace[]> {
    return this.repo.findAll(type);
  }

  async getDetail(id: string): Promise<PublicPlace> {
    const place = await this.repo.findById(id);

    if (!place || !place.isActive) {
      throw new Error("PUBLIC_PLACE_NOT_FOUND");
    }

    return place;
  }

  async create(data: PublicPlace): Promise<PublicPlace> {
    return this.repo.create({
      ...data,
      gallery: data.gallery ?? [],
      isActive: true,
    });
  }

  async update(id: string, data: PublicPlace): Promise<PublicPlace> {
    return this.repo.update(id, data);
  }

  async deactivate(id: string): Promise<PublicPlace> {
    return this.repo.deactivate(id);
  }

  async toggleLike(placeId: string, userId: string) {
    try {
      const result = await this.likeRepo.likePublicPlace(placeId, userId);

      return {
        status: true,
        status_code: 201,
        message: "Venue like toggled",
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getLikeCount(placeId: string, userId: string) {
    try {
      const [count, liked] = await Promise.all([
        this.likeRepo.countLikesByPlaceId(placeId),
        userId ? this.likeRepo.isLikedByUser(placeId, userId) : false,
      ]);

      return {
        status: true,
        status_code: 200,
        message: "Like count retrieved",
        data: { count, likedByMe: liked },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async createImpression(data: { placeId: string; userId?: string }) {
    try {
      await this.impressionRepo.createImpression(data);

      return {
        status: true,
        status_code: 201,
        message: "Impression recorded",
        data: null,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getImpressionCount(placeId: string) {
    try {
      const count = await this.impressionRepo.countImpressionByPlaceId(placeId);

      return {
        status: true,
        status_code: 200,
        message: "Impression count retrieved",
        data: { count },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }
}
