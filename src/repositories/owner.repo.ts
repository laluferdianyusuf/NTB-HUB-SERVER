import { Owner, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class OwnerRepository {
  async createOwner(data: Owner): Promise<Owner> {
    return await prisma.owner.create({
      data,
    });
  }

  async findOwnerById(id: string): Promise<Owner> {
    return await prisma.owner.findUnique({
      where: { id },
    });
  }

  async findOwnerByVenue(venueId: string): Promise<Owner> {
    return await prisma.owner.findUnique({
      where: { venueId },
    });
  }
}
