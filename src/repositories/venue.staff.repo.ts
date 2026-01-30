import { Prisma, PrismaClient, VenueStaff } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueStaffRepository {
  async createStaff(
    data: Prisma.VenueStaffCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;
    return client.venueStaff.create({ data });
  }

  async findStaffById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.venueStaff.findUnique({ where: { id } });
  }

  async updateStaff(
    id: string,
    data: Partial<VenueStaff>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;
    return client.venueStaff.update({ where: { id }, data });
  }

  async deleteStaff(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.venueStaff.delete({ where: { id } });
  }

  async listStaffByVenue(venueId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.venueStaff.findMany({ where: { venueId } });
  }
}
