import { Venue } from "@prisma/client";
import {
  VenueRepository,
  InvitationKeyRepository,
  VenueBalanceRepository,
  VenueLikeRepository,
  VenueImpressionRepository,
} from "../repositories";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { uploadToCloudinary } from "utils/image";
import { publisher } from "config/redis.config";
import { toNum } from "helpers/parser";

const redis = new Redis();

const venueRepository = new VenueRepository();
const invitationRepository = new InvitationKeyRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const venueLikeRepository = new VenueLikeRepository();
const venueImpressionRepository = new VenueImpressionRepository();

export class VenueServices {
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
    files?: { image?: Express.Multer.File[]; gallery?: Express.Multer.File[] },
  ) {
    try {
      let imageUrl: string | undefined;
      let galleryUrls: string[] | undefined;

      if (files?.image?.length) {
        imageUrl = await uploadToCloudinary(files.image[0].path, "venues");
      }

      if (files?.gallery?.length) {
        galleryUrls = await Promise.all(
          files.gallery.map((file) => uploadToCloudinary(file.path, "venues")),
        );
      }

      const existing = await venueRepository.findVenueById(id);
      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
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

      return {
        status: true,
        status_code: 200,
        message: "Venue updated successfully",
        data: {
          ...updatedVenue,
        },
      };
    } catch (error: any) {
      console.error("Error updating venue:", error);
      return {
        status: false,
        status_code: 500,
        message: "Internal server error: " + error.message,
        data: null,
      };
    }
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

  async signInWithInvitationKey(invitationKey: string) {
    try {
      const invitation = await invitationRepository.findByKey(invitationKey);
      if (!invitation) {
        return {
          status: false,
          status_code: 404,
          message: "Invalid or unknown invitation key",
          data: null,
        };
      }

      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return {
          status: false,
          status_code: 400,
          message: "Invitation key has expired",
          data: null,
        };
      }

      const venue = await venueRepository.findVenueById(invitation.venueId);
      if (!venue) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found for this invitation",
          data: null,
        };
      }
      let accessToken = null;
      let refreshToken = null;
      if (venue.isActive === true) {
        accessToken = jwt.sign(
          {
            venueId: venue.id,
            name: venue.name,
            role: "VENUE",
            createdAt: venue.createdAt,
          },
          process.env.ACCESS_SECRET,
          { expiresIn: "15m" },
        );

        refreshToken = jwt.sign(
          {
            venueId: venue.id,
            name: venue.name,
            role: "VENUE",
            createdAt: venue.createdAt,
          },
          process.env.REFRESH_SECRET,
          { expiresIn: "7d" },
        );
      } else {
        accessToken = jwt.sign(
          {
            venueId: venue.id,
          },
          process.env.ACCESS_SECRET,
          { expiresIn: "15m" },
        );

        refreshToken = jwt.sign(
          {
            venueId: venue.id,
          },
          process.env.REFRESH_SECRET,
          { expiresIn: "7d" },
        );
      }

      await redis.set(
        `venue:refresh:${venue.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );

      return {
        status: true,
        status_code: 200,
        message: "Login successful using invitation key",
        data: {
          accessToken,
          refreshToken,
          venue: {
            ...venue,
            role: "VENUE",
          },
        },
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

  async refreshVenueToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        return {
          status: false,
          status_code: 400,
          message: "Missing venue refresh token",
        };
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET,
      ) as any;
      const storedToken = await redis.get(`venue:refresh:${decoded.venueId}`);

      if (!storedToken || storedToken !== refreshToken) {
        return {
          status: false,
          status_code: 403,
          message: "Invalid or expired refresh token",
        };
      }

      const venue = await venueRepository.findVenueById(decoded.venueId);

      if (!venue) {
        return { status: false, status_code: 404, message: "Venue not found" };
      }

      const newAccessToken = jwt.sign(
        { venueId: venue.id, name: venue.name },
        process.env.ACCESS_SECRET,
        { expiresIn: "15m" },
      );

      const newRefreshToken = jwt.sign(
        { venueId: venue.id, name: venue.name },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      await redis.set(
        `venue:refresh:${venue.id}`,
        newRefreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );

      return {
        status: true,
        status_code: 200,
        message: "Access token refreshed successfully",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return {
          status: false,
          status_code: 401,
          message: "Refresh token expired, please login again",
        };
      }
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
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
