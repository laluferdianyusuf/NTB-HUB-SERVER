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
import { GetVenuesParams } from "types/venues.params";

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

    if (files?.image) {
      const image = await uploadImage({
        file: files?.image,
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

  async getVenues(params: GetVenuesParams) {
    const {
      search,
      category = "all",
      subCategory = "all",
      page = 1,
      limit = 20,
      includeServices = false,
    } = params;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      venueRepository.findAllVenues({
        search,
        category,
        subCategory,
        skip,
        take: limit,
        includeServices,
      }),
      venueRepository.countVenues({ search, category }),
    ]);

    const shapedData = data.map((venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      image: venue.image,
      gallery: venue.gallery,
      category: venue.services?.[0]?.subCategory?.category || null,
      services: includeServices ? venue.services : undefined,
      updatedAll: venue.updatedAt,
    }));

    return {
      data: shapedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPopularVenues(params: GetVenuesParams) {
    const {
      search,
      category = "all",
      subCategory = "all",
      page = 1,
      limit = 20,
      includeServices = false,
    } = params;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      venueRepository.findPopularVenues({
        search,
        category,
        subCategory,
        skip,
        take: limit,
        includeServices,
      }),
      venueRepository.countVenues({ search, category }),
    ]);

    const shapedData = data.map((venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      image: venue.image,
      gallery: venue.gallery,
      category: venue.services?.[0]?.subCategory?.category || null,
      services: includeServices ? venue.services : undefined,
      updatedAll: venue.updatedAt,
    }));

    return {
      data: shapedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVenueLikedByUser(userId: string) {
    const venues = await venueRepository.findVenueLikedByUser(userId);

    if (!venues) {
      throw new Error("No venue found");
    }

    return venues;
  }

  async getVenueById(id: string) {
    const existing = await venueRepository.findVenueById(id);

    if (!existing) {
      throw new Error("Venue not found");
    }

    return existing;
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
    const existing = await venueRepository.findVenueById(id);

    if (!existing) {
      throw new Error("Venue not found");
    }

    const deleted = await venueRepository.deleteVenueWithRelations(id);

    return deleted;
  }

  async toggleLike(venueId: string, userId: string) {
    const result = await venueLikeRepository.likeVenue(venueId, userId);

    return result;
  }

  async getLikeCount(venueId: string, userId: string) {
    const [count, liked] = await Promise.all([
      venueLikeRepository.countLikesByVenueId(venueId),
      userId ? venueLikeRepository.isLikedByUser(venueId, userId) : false,
    ]);

    return {
      count,
      likedByMe: liked,
    };
  }

  async createImpression(data: {
    venueId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await venueImpressionRepository.createImpression(data);
  }

  async getImpressionCount(venueId: string) {
    const count =
      await venueImpressionRepository.countImpressionByVenueId(venueId);

    return { count };
  }
}
