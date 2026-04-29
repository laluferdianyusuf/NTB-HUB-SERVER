import { PrismaClient } from "@prisma/client";
import { VenueStaffRepository } from "repositories";

const prisma = new PrismaClient();
const repo = new VenueStaffRepository();

export class VenueStaffService {
  async createStaff(venueId: string, payload: any) {
    return prisma.$transaction(async (tx) => {
      if (payload.phone) {
        const exists = await repo.findByPhone(venueId, payload.phone, tx);

        if (exists) {
          throw new Error("Phone already used");
        }
      }

      return repo.create(
        {
          ...payload,
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

  async updateStaff(staffId: string, payload: any) {
    return prisma.$transaction(async (tx) => {
      const staff = await repo.findById(staffId, tx);

      if (!staff) {
        throw new Error("Staff not found");
      }

      if (payload.phone && payload.phone !== staff.phone) {
        const used = await repo.findByPhone(staff.venueId, payload.phone, tx);

        if (used && used.id !== staffId) {
          throw new Error("Phone already used");
        }
      }

      return repo.update(staffId, payload, tx);
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
