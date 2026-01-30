import { PrismaClient } from "@prisma/client";
import { VenueStaffRepository } from "repositories";

const prisma = new PrismaClient();
const staffRepo = new VenueStaffRepository();

export class VenueStaffService {
  async addStaff(venueId: string, data: any) {
    return prisma.$transaction(async (tx) => {
      return staffRepo.createStaff({ ...data, venueId }, tx);
    });
  }

  async updateStaff(staffId: string, data: any) {
    const existing = await staffRepo.findStaffById(staffId);
    if (!existing) throw new Error("Staff not found");
    return staffRepo.updateStaff(staffId, data);
  }

  async deleteStaff(staffId: string) {
    const existing = await staffRepo.findStaffById(staffId);
    if (!existing) throw new Error("Staff not found");
    return staffRepo.deleteStaff(staffId);
  }

  async listStaff(venueId: string) {
    return staffRepo.listStaffByVenue(venueId);
  }
}
