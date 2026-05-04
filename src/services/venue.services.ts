import { Venue } from "@prisma/client";
import { publisher } from "config/redis.config";
import { calcDistanceMeters, formatDistance } from "helpers/haversine";
import { toNum } from "helpers/parser";
import { GetVenuesParams } from "types/venues.params";
import { uploadImage } from "utils/uploadS3";
import {
  BookingRepository,
  InvoiceRepository,
  UserRepository,
  VenueBalanceRepository,
  VenueImpressionRepository,
  VenueLikeRepository,
  VenueRepository,
} from "../repositories";

type Segment = "VIP" | "Returning" | "New" | "Blocked";

const venueRepository = new VenueRepository();
const userRepository = new UserRepository();
const bookingRepository = new BookingRepository();
const invoiceRepository = new InvoiceRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const venueLikeRepository = new VenueLikeRepository();
const venueImpressionRepository = new VenueImpressionRepository();

export class VenueServices {
  private getSegment(bookings: number, spent: number): Segment {
    if (spent > 5_000_000) return "VIP";
    if (bookings > 3) return "Returning";
    if (bookings === 1) return "New";
    return "Blocked";
  }

  async getCustomers(
    venueId: string,
    search?: string,
    segment?: "all" | "vip" | "returning" | "new" | "blocked",
  ) {
    let users = await userRepository.getUsersByVenue(venueId, search);

    const bookings = await bookingRepository.getBookingsByVenue(venueId);

    const bookingIds = bookings.map((b) => b.id);

    const invoices =
      await invoiceRepository.getInvoicesByBookingIds(bookingIds);

    const bookingMap = new Map<string, any[]>();

    for (const b of bookings) {
      if (!bookingMap.has(b.userId)) {
        bookingMap.set(b.userId, []);
      }
      bookingMap.get(b.userId)!.push(b);
    }

    const invoiceMap = new Map<string, number>();

    for (const inv of invoices) {
      const prev = invoiceMap.get(inv.entityId) ?? 0;
      invoiceMap.set(inv.entityId, prev + Number(inv.amount));
    }

    let enriched = users.map((user) => {
      const userBookings = bookingMap.get(user.id) ?? [];

      let spent = 0;

      for (const b of userBookings) {
        spent += invoiceMap.get(b.id) ?? 0;
      }

      const bookingsCount = userBookings.length;

      const lastVisit =
        userBookings.length > 0
          ? userBookings.reduce((latest, curr) =>
              new Date(curr.createdAt) > new Date(latest.createdAt)
                ? curr
                : latest,
            ).createdAt
          : null;

      const segmentCalculated = this.getSegment(bookingsCount, spent);

      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        bookings: bookingsCount,
        spent,
        lastVisit,
        segment: segmentCalculated,
      };
    });

    if (segment && segment !== "all") {
      enriched = enriched.filter((u) => u.segment.toLowerCase() === segment);
    }

    const summary = {
      total: enriched.length,
      vip: 0,
      returning: 0,
      new: 0,
      blocked: 0,
      totalSpent: 0,
    };

    for (const u of enriched) {
      summary.totalSpent += u.spent;

      if (u.segment === "VIP") summary.vip++;
      if (u.segment === "Returning") summary.returning++;
      if (u.segment === "New") summary.new++;
      if (u.segment === "Blocked") summary.blocked++;
    }

    return {
      data: enriched,
      summary,
    };
  }

  async createVenue(
    payload: Venue,
    files?: {
      image?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ): Promise<Venue> {
    let imageUrl: string | null = null;
    let galleryUrls: string[] = [];

    if (files?.image) {
      const image = await uploadImage({
        file: files?.image[0],
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
      latitude,
      longitude,
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
        skip: 0,
        take: 1000,
        includeServices,
      }),
      venueRepository.countVenues({ search, category }),
    ]);

    const enriched = data.map((venue) => {
      let distanceMeters: number | null = null;

      if (
        latitude != null &&
        longitude != null &&
        venue.latitude != null &&
        venue.longitude != null
      ) {
        distanceMeters = calcDistanceMeters(
          latitude,
          longitude,
          venue.latitude,
          venue.longitude,
        );
      }

      const distanceKm = distanceMeters != null ? distanceMeters / 1000 : 999;

      const score =
        Math.log1p(venue.totalLikes ?? 0) * 3 +
        Math.log1p(venue.totalViews ?? 0) * 1 +
        Math.log1p(venue.totalReviews ?? 0) * 2 +
        Math.exp(-distanceKm) * 10;

      return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        image: venue.image,
        gallery: venue.gallery,

        totalLikes: venue.totalLikes,
        totalReviews: venue.totalReviews,
        totalViews: venue.totalViews,

        latitude: venue.latitude,
        longitude: venue.longitude,

        category: venue.services?.[0]?.subCategory?.category || null,
        services: includeServices ? venue.services : undefined,

        updatedAll: venue.updatedAt,
        isActive: venue.isActive,

        distance: distanceMeters,
        distanceKm,

        distanceLabel: formatDistance(distanceMeters),

        score,
      };
    });

    const ranked = enriched.sort((a, b) => b.score - a.score);

    const paginated = ranked.slice(skip, skip + limit);

    return {
      data: paginated,
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
      latitude,
      longitude,
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
        skip: 0,
        take: 1000,
        includeServices,
      }),
      venueRepository.countVenues({ search, category }),
    ]);

    const enriched = data.map((venue) => {
      let distanceMeters: number | null = null;

      if (
        latitude != null &&
        longitude != null &&
        venue.latitude != null &&
        venue.longitude != null
      ) {
        distanceMeters = calcDistanceMeters(
          latitude,
          longitude,
          venue.latitude,
          venue.longitude,
        );
      }

      const distanceKm = distanceMeters != null ? distanceMeters / 1000 : 999;

      const score =
        Math.log1p(venue.totalLikes ?? 0) * 3 +
        Math.log1p(venue.totalViews ?? 0) * 1 +
        Math.log1p(venue.totalReviews ?? 0) * 2 +
        Math.exp(-distanceKm) * 10;

      return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        image: venue.image,
        gallery: venue.gallery,

        totalLikes: venue.totalLikes,
        totalReviews: venue.totalReviews,
        totalViews: venue.totalViews,

        latitude: venue.latitude,
        longitude: venue.longitude,

        category: venue.services?.[0]?.subCategory?.category || null,
        services: includeServices ? venue.services : undefined,

        updatedAll: venue.updatedAt,
        isActive: venue.isActive,

        distance: distanceMeters,
        distanceKm,

        distanceLabel: formatDistance(distanceMeters),

        score,
      };
    });

    const ranked = enriched.sort((a, b) => b.score - a.score);

    const paginated = ranked.slice(skip, skip + limit);

    return {
      data: paginated,
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

  async getVenueById(id: string, userId?: string) {
    const existing = await venueRepository.findVenueById(id);

    if (!existing) {
      throw new Error("Venue not found");
    }

    let isLiked = false;
    if (userId) {
      const liked = await venueLikeRepository.isLikedByUser(id, userId);
      isLiked = !!liked;
    }

    return { ...existing, isLiked };
  }

  async updateVenue(
    id: string,
    data: Partial<Venue>,
    files?: { image?: Express.Multer.File[]; gallery?: Express.Multer.File[] },
  ) {
    const existing = await venueRepository.findVenueById(id);

    if (!existing) {
      throw new Error("Venue not found");
    }

    const updatePayload: Partial<Venue> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.latitude !== undefined)
      updatePayload.latitude = toNum(data.latitude);

    if (data.longitude !== undefined)
      updatePayload.longitude = toNum(data.longitude);

    if (files?.image?.length) {
      const image = await uploadImage({
        file: files.image[0],
        folder: "venues",
      });

      updatePayload.image = image.url;
    }

    if (files?.gallery?.length) {
      const gallery = await Promise.all(
        files.gallery.map((file) =>
          uploadImage({
            file,
            folder: "venues",
          }),
        ),
      );

      updatePayload.gallery = gallery.map((img) => img.url);
    }

    const updatedVenue = await venueRepository.updateVenue(id, updatePayload);

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
    const liked = await venueLikeRepository.isLikedByUser(venueId, userId);

    if (liked) {
      await venueLikeRepository.unlikeVenue(venueId, userId);
      return { liked: false };
    }

    await venueLikeRepository.likeVenue(venueId, userId);
    return { liked: true };
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
