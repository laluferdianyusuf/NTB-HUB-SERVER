import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OperationalRepository {
  async getOperationalHours(venueId: string) {
    return await prisma.operationalHour.findMany({
      where: { venueId },
    });
  }

  getOperationalHourOfWeek(venueId: string, dayOfWeek: number) {
    return prisma.operationalHour.findFirst({
      where: { venueId, dayOfWeek },
    });
  }

  async create(
    venueId: string,
    data: {
      dayOfWeek: number;
      opensAt: number;
      closesAt: number;
    },
  ) {
    return prisma.operationalHour.create({
      data: {
        venueId,
        dayOfWeek: data.dayOfWeek,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
      },
    });
  }

  async createMany(
    venueId: string,
    hours: {
      dayOfWeek: number;
      opensAt: number;
      closesAt: number;
    }[],
  ) {
    return prisma.operationalHour.createMany({
      data: hours.map((h) => ({
        venueId,
        dayOfWeek: h.dayOfWeek,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
      })),
    });
  }

  async update(
    id: string,
    data: Partial<{
      dayOfWeek: number;
      opensAt: number;
      closesAt: number;
    }>,
  ) {
    return prisma.operationalHour.update({
      where: { id },
      data,
    });
  }

  async findOperationalByVenueId(venueId: string) {
    return await prisma.operationalHour.findMany({
      where: { venueId },
    });
  }

  async updateByVenueAndDay(
    venueId: string,
    dayOfWeek: number,
    data: {
      opensAt: number;
      closesAt: number;
    },
  ) {
    return prisma.operationalHour.updateMany({
      where: { venueId, dayOfWeek },
      data,
    });
  }

  async delete(id: string) {
    return prisma.operationalHour.delete({
      where: { id },
    });
  }
}
