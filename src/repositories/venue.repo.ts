import { PrismaClient, Venue } from "@prisma/client";

const prisma = new PrismaClient();

export class VenueRepository {
  async findAllVenue(): Promise<Venue[]> {
    return await prisma.venue.findMany();
  }

  async findVenueById(id: string): Promise<Venue | null> {
    return prisma.venue.findUnique({ where: { id } });
  }

  async createVenue(data: Venue): Promise<Venue> {
    return prisma.venue.create({ data });
  }

  async updateVenue(id: string, data: Partial<Venue>): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data,
    });
  }

  async deleteVenue(id: string): Promise<Venue> {
    return prisma.venue.delete({ where: { id } });
  }
}
