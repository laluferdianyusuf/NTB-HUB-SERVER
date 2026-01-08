import { Prisma, PrismaClient, Venue } from "@prisma/client";
import {
  VenueRepository,
  InvitationKeyRepository,
  VenueBalanceRepository,
  OwnerRepository,
  OperationalRepository,
} from "../repositories";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "utils/mail";
import Redis from "ioredis";
import { uploadToCloudinary } from "utils/image";
import { publisher } from "config/redis.config";
import { toBool, toNum } from "helpers/parser";

const prisma = new PrismaClient();
const redis = new Redis();

const venueRepository = new VenueRepository();
const invitationRepository = new InvitationKeyRepository();
const venueBalanceRepository = new VenueBalanceRepository();
const ownerRepository = new OwnerRepository();
const operationalRepository = new OperationalRepository();

type OperationalHourInput = {
  dayOfWeek: number;
  opensAt: string; // "09:00"
  closesAt: string; // "22:00"
  isOpen: boolean;
};

type UpdateVenueInput = Partial<Venue> & {
  operationalHours?: OperationalHourInput[];
};

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
    data: UpdateVenueInput,
    files?: { image?: Express.Multer.File[]; gallery?: Express.Multer.File[] }
  ) {
    try {
      let imageUrl: string | undefined;
      let galleryUrls: string[] | undefined;

      if (files?.image?.length) {
        imageUrl = await uploadToCloudinary(files.image[0].path, "venues");
      }

      if (files?.gallery?.length) {
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

      const updatedVenue = await venueRepository.updateVenue(id, {
        name: data.name,
        type: data.type,
        address: data.address,
        latitude: toNum(data.latitude),
        longitude: toNum(data.longitude),
        hasFloors: toBool(data.hasFloors),
        hasTables: toBool(data.hasTables),
        hasMenu: toBool(data.hasMenu),
        hasDelivery: toBool(data.hasDelivery),
        isActive: true,
        ...(imageUrl && { image: imageUrl }),
        ...(galleryUrls && { gallery: galleryUrls }),
      });

      let operationalHours = data.operationalHours;
      if (typeof operationalHours === "string") {
        try {
          operationalHours = JSON.parse(operationalHours);
        } catch {
          operationalHours = [];
        }
      }

      if (Array.isArray(operationalHours) && operationalHours.length > 0) {
        const existingOps = await operationalRepository.getOperationalHours(id);

        await Promise.all(
          operationalHours.map(async (op) => {
            console.log(op);

            if (!op.isOpen) return;

            const opensAt = new Date();
            const [oh, om] = op.opensAt.split(":");
            opensAt.setHours(Number(oh), Number(om), 0, 0);

            const closesAt = new Date();
            const [ch, cm] = op.closesAt.split(":");
            closesAt.setHours(Number(ch), Number(cm), 0, 0);

            const found = existingOps.find((x) => x.dayOfWeek === op.dayOfWeek);

            if (found) {
              await operationalRepository.update(found.id, {
                opensAt,
                closesAt,
              });
            } else {
              await operationalRepository.create(id, {
                dayOfWeek: op.dayOfWeek,
                opensAt,
                closesAt,
              });
            }
          })
        );
      }

      const owner = await ownerRepository.findOwnerByVenue(id);
      await venueBalanceRepository.ensureInitialBalance(id);
      const invitation = await invitationRepository.findByVenueId(id);

      const wasInactive = !existing.isActive;
      const willBeActive = true;

      if (invitation && wasInactive && willBeActive) {
        const newKey = `SIGN-${randomUUID().slice(0, 8).toUpperCase()}`;

        await invitationRepository.updateByVenueId(id, {
          key: newKey,
          expiresAt: null,
          usedAt: new Date(),
          updatedAt: new Date(),
        });

        await sendEmail(
          owner.email,
          "Sign In Key",
          `
          <a
            href="com.laluferdian.ntbhubapps://venue?key=${newKey}"
            style="padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;"
          >
            Buka Aplikasi
          </a>
          <h2>You're all set!</h2>
          <p>Your venue has been activated.</p>
          <h3>${newKey}</h3>
        `
        );
      }

      await publisher.publish(
        "venue-events",
        JSON.stringify({
          event: "venue:updated",
          payload: updatedVenue,
        })
      );

      return {
        status: true,
        status_code: 200,
        message: "Venue updated successfully",
        data: {
          ...updatedVenue,
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
