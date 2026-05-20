import { Prisma } from "@prisma/client";
import { VenueStaffRepository } from "repositories";
import { uploadImage } from "utils/uploadS3";

import { prisma } from "../config/prisma";
const repo = new VenueStaffRepository();

export class VenueStaffService {
  async createStaff(
    venueId: string,
    payload: Prisma.VenueStaffCreateInput,
    file: Express.Multer.File,
  ) {
    return prisma.$transaction(async (tx) => {
      let imageUrl: string | null = null;

      if (file) {
        const image = await uploadImage({ file, folder: "staff" });
        imageUrl = image.url;
      }

      if (payload.phone) {
        const exists = await repo.findByPhone(venueId, payload.phone, tx);

        if (exists) {
          throw new Error("Phone already used");
        }
      }

      return repo.create(
        {
          ...payload,
          photo: imageUrl,
          venue: {
            connect: {
              id: venueId,
            },
          },
        },
        tx,
      );
    });
  }

  async updateStaff(
    staffId: string,
    payload: Prisma.VenueStaffUpdateInput,
    file: Express.Multer.File,
  ) {
    console.log(file, payload);

    return prisma.$transaction(async (tx) => {
      let imageUrl: string | null = null;

      if (file) {
        const image = await uploadImage({ file, folder: "staff" });
        imageUrl = image.url;
      }

      const staff = await repo.findById(staffId, tx);

      if (!staff) {
        throw new Error("Staff not found");
      }

      if (payload.phone && payload.phone !== staff.phone) {
        const used = await repo.findByPhone(
          staff.venueId,
          payload.phone as string,
          tx,
        );

        if (used && used.id !== staffId) {
          throw new Error("Phone already used");
        }
      }

      return repo.update(staffId, { ...payload, photo: imageUrl }, tx);
    });
  }

  async deleteStaff(staffId: string) {
    const staff = await repo.findById(staffId);

    if (!staff) {
      throw new Error("Staff not found");
    }

    return repo.delete(staffId);
  }

  async detailStaff(staffId: string) {
    const staff = await repo.findById(staffId);

    if (!staff) {
      throw new Error("Staff not found");
    }

    return staff;
  }

  async listStaff(venueId: string, page = 1, limit = 10, search?: string) {
    return repo.paginate(venueId, page, limit, search);
  }
}
