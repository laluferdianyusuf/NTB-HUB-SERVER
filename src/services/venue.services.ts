import { Venue } from "@prisma/client";
import {
  VenueRepository,
  VenueBalanceRepository,
  VenueLikeRepository,
  VenueImpressionRepository,
} from "../repositories";
import { publisher } from "config/redis.config";
import { toNum } from "helpers/parser";
import { uploadImage } from "utils/uploadS3";

const venueRepository = new VenueRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const venueLikeRepository = new VenueLikeRepository();
const venueImpressionRepository = new VenueImpressionRepository();

export class VenueServices {
  async createVenue(
    payload: Venue,
    files?: {
      image?: Express.Multer.File;
      gallery?: Express.Multer.File[];
    },
  ): Promise<Venue> {
    let imageUrl: string | null = null;
    let galleryUrls: string[] = [];

    if (files?.image?.[0]) {
      const image = await uploadImage({
        file: files.image?.[0],
        folder: "public_places",
      });
      imageUrl = image.url;
    }

    if (files?.gallery?.length) {
      const gallery = await Promise.all(
        files.gallery.map((file) =>
          uploadImage({ file: file, folder: "public_places" }),
        ),
      );

      galleryUrls = gallery.map((img) => img.url);
    }

    if (
      !payload.name ||
      !payload.address ||
      !payload.city ||
      !payload.province
    ) {
      throw new Error("Required fields are missing");
    }

    return venueRepository.createVenue({
      ...payload,
      latitude: toNum(payload.latitude),
      longitude: toNum(payload.longitude),
      image: imageUrl,
      gallery: galleryUrls,
    });
  }

  async activateVenue(venueId: string) {
    const venue = await venueRepository.findVenueById(venueId);

    if (!venue) throw new Error("Venue not found");

    if (venue.operationalHours.length === 0) {
      throw new Error("Operational hours must be set");
    }

    if (venue.services.length === 0) {
      throw new Error("At least one active service is required");
    }

    for (const service of venue.services) {
      if (service.unitType && service.units.length === 0) {
        throw new Error(
          `Service "${service.id}" requires at least one active unit`,
        );
      }
    }

    const activate = await venueRepository.activateVenue(venueId);

    return activate;
  }

  async getActiveVenues() {
    const venues = await venueRepository.findActiveVenue();

    if (!venues) throw new Error("Venue not found");

    return venues;
  }

  async getVenues() {
    const venues = await venueRepository.findAllVenue();
    if (!venues) throw new Error("Venue not found");
    return venues;
  }

  async getPopularVenues() {
    const venues = await venueRepository.findPopularVenues();
    if (!venues) throw new Error("Venue not found");
    return venues;
  }

  async getVenuesByCategoryId(categoryId: string) {
    const venues = await venueRepository.findVenueByCategory(categoryId);
    if (!venues) throw new Error("Venue not found");
    return venues;
  }

  async getPopularVenuesByCategoryId(categoryId: string) {
    const venues = await venueRepository.findPopularVenueByCategory(categoryId);
    if (!venues) throw new Error("Venue not found");
    return venues;
  }

  async getVenueLikedByUser(userId: string) {
    const venues = await venueRepository.findVenueLikedByUser(userId);

    if (!venues) {
      throw new Error("No venue found");
    }

    return venues;
  }

  async getVenueById(id: string) {
    try {
      const existing = await venueRepository.findVenueById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Venue founded",
        data: existing,
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

  async updateVenue(
    id: string,
    data: Partial<Venue>,
    files?: { image?: Express.Multer.File; gallery?: Express.Multer.File[] },
  ) {
    const existing = await venueRepository.findVenueById(id);
    if (!existing) {
      throw new Error("Venue not found");
    }

    let imageUrl: string | null = null;
    let galleryUrls: string[] | null = null;

    if (files?.image) {
      const image = await uploadImage({ file: files.image, folder: "venues" });
      imageUrl = image.url;
    }

    if (files?.gallery?.length) {
      const gallery = await Promise.all(
        files.gallery.map((file) =>
          uploadImage({ file: file, folder: "venues" }),
        ),
      );

      galleryUrls = gallery.map((img) => img.url);
    }

    const updatedVenue = await venueRepository.updateVenue(id, {
      name: data.name,
      address: data.address,
      latitude: toNum(data.latitude),
      longitude: toNum(data.longitude),
      ...(imageUrl && { image: imageUrl }),
      ...(galleryUrls && { gallery: galleryUrls }),
    });

    await venueBalanceRepository.ensureInitialBalance(id);

    await publisher.publish(
      "venue-events",
      JSON.stringify({
        event: "venue:updated",
        payload: updatedVenue,
      }),
    );

    return updatedVenue;
  }

  async deleteVenue(id: string) {
    try {
      const existing = await venueRepository.findVenueById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }
      const deleted = await venueRepository.deleteVenueWithRelations(id);

      return {
        status: true,
        status_code: 200,
        message: "Venue deleted",
        data: deleted,
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

  async toggleLike(venueId: string, userId: string) {
    try {
      const result = await venueLikeRepository.likeVenue(venueId, userId);

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

  async getLikeCount(venueId: string, userId: string) {
    try {
      const [count, liked] = await Promise.all([
        venueLikeRepository.countLikesByVenueId(venueId),
        userId ? venueLikeRepository.isLikedByUser(venueId, userId) : false,
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

  async createImpression(data: {
    venueId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await venueImpressionRepository.createImpression(data);

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

  async getImpressionCount(venueId: string) {
    try {
      const count =
        await venueImpressionRepository.countImpressionByVenueId(venueId);

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
