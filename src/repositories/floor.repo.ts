import { PrismaClient, Floor as PrismaFloor } from "@prisma/client";
import { Floor } from "../../models/floor.model";

const prisma = new PrismaClient();

export class FloorRepository {
  // find all floor at venue
  async findFloorByVenueId(venueId: string): Promise<Floor[]> {
    return prisma.floor.findMany({ where: { venueId } });
  }

  // find detail of floor
  async findFloorById(id: string): Promise<Floor | null> {
    return prisma.floor.findUnique({ where: { id } });
  }

  //   create new floor at venue
  async createNewFloorByVenueId(
    data: Floor,
    venueId: string
  ): Promise<PrismaFloor> {
    return prisma.floor.create({
      data: { ...data, venueId },
    });
  }

  // update floor
  async updateFloor(
    floorId: string,
    data: Partial<Floor>
  ): Promise<PrismaFloor> {
    return prisma.floor.update({ where: { id: floorId }, data });
  }

  // delete floor
  async deleteFloor(floorId: string): Promise<PrismaFloor> {
    return prisma.floor.delete({ where: { id: floorId } });
  }
}
