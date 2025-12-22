import { Venue } from "@prisma/client";
import {
  VenueRepository,
  InvitationKeyRepository,
  VenueBalanceRepository,
  OwnerRepository,
} from "../repositories";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "utils/mail";
import Redis from "ioredis";
import { uploadToCloudinary } from "utils/image";
import { publisher } from "config/redis.config";
const redis = new Redis();

const venueRepository = new VenueRepository();
const invitationRepository = new InvitationKeyRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const ownerRepository = new OwnerRepository();

export class VenueServices {
  async getVenues() {
    try {
      const venues = await venueRepository.findAllVenue();
      return {
        status: true,
        status_code: 200,
        message: "Venues retrieved",
        data: venues,
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
    files?: { image?: Express.Multer.File[]; gallery?: Express.Multer.File[] }
  ) {
    try {
      let imageUrl: string | undefined;
      let galleryUrls: string[] | undefined;

      if (files?.image && files.image.length > 0) {
        imageUrl = await uploadToCloudinary(files.image[0].path, "venues");
      }

      if (files?.gallery && files.gallery.length > 0) {
        galleryUrls = await Promise.all(
          files.gallery.map((file) => uploadToCloudinary(file.path, "venues"))
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

      const owner = await ownerRepository.findOwnerByVenue(id);

      await venueBalanceRepository.ensureInitialBalance(id);

      let invitation = await invitationRepository.findByVenueId(id);

      if (invitation && !existing.isActive) {
        const newKey = `SIGN-${randomUUID().slice(0, 8).toUpperCase()}`;

        invitation = await invitationRepository.updateByVenueId(id, {
          key: newKey,
          expiresAt: null,
          usedAt: new Date(),
          updatedAt: new Date(),
        });

        await sendEmail(
          owner.email,
          "Sign In Key",
          `
          <h2>You're all set!</h2>
          <p>Your venue has been activated.</p>
          <p>Use this signin key:</p>
          <h3>${newKey}</h3>
          <p>Open NTB Hub to manage your venue</p>
        `
        );
      }

      const updated = await venueRepository.updateVenue(id, {
        ...data,
        isActive: true,
        ...(imageUrl && { image: imageUrl }),
        ...(galleryUrls && { gallery: galleryUrls }),
      });

      await publisher.publish(
        "venue-events",
        JSON.stringify({
          event: "venue:updated",
          payload: updated,
        })
      );
      return {
        status: true,
        status_code: 200,
        message: "Venue updated successfully",
        data: {
          ...updated,
          invitationKey: invitation ? invitation.key : null,
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
            type: venue.type,
            createdAt: venue.createdAt,
          },
          process.env.ACCESS_SECRET,
          { expiresIn: "15m" }
        );

        refreshToken = jwt.sign(
          {
            venueId: venue.id,
            name: venue.name,
            type: venue.type,
            createdAt: venue.createdAt,
          },
          process.env.REFRESH_SECRET,
          { expiresIn: "7d" }
        );
      } else {
        accessToken = jwt.sign(
          {
            venueId: venue.id,
          },
          process.env.ACCESS_SECRET,
          { expiresIn: "15m" }
        );

        refreshToken = jwt.sign(
          {
            venueId: venue.id,
          },
          process.env.REFRESH_SECRET,
          { expiresIn: "7d" }
        );
      }

      await redis.set(
        `venue:refresh:${venue.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60
      );

      return {
        status: true,
        status_code: 200,
        message: "Login successful using invitation key",
        data: {
          accessToken,
          refreshToken,
          venue,
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
        process.env.REFRESH_SECRET
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
        { venueId: venue.id, name: venue.name, type: venue.type },
        process.env.ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const newRefreshToken = jwt.sign(
        { venueId: venue.id, name: venue.name, type: venue.type },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      await redis.set(
        `venue:refresh:${venue.id}`,
        newRefreshToken,
        "EX",
        7 * 24 * 60 * 60
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
}
