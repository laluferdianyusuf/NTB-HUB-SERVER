import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CreateHourInput = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
};

type UpdateHourInput = Partial<CreateHourInput>;

export class OperationalRepository {
  async findAllByVenue(venueId: string) {
    return prisma.operationalHour.findMany({
      where: { venueId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async findByVenueAndDay(venueId: string, dayOfWeek: number) {
    return prisma.operationalHour.findFirst({
      where: {
        venueId,
        dayOfWeek,
      },
    });
  }

  async findById(id: string) {
    return prisma.operationalHour.findUnique({
      where: { id },
    });
  }

  async create(venueId: string, data: CreateHourInput) {
    return prisma.operationalHour.create({
      data: {
        venueId,
        dayOfWeek: data.dayOfWeek,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
      },
    });
  }

  async createMany(venueId: string, hours: CreateHourInput[]) {
    return prisma.operationalHour.createMany({
      data: hours.map((item) => ({
        venueId,
        dayOfWeek: item.dayOfWeek,
        opensAt: item.opensAt,
        closesAt: item.closesAt,
      })),
    });
  }

  async update(id: string, data: UpdateHourInput) {
    return prisma.operationalHour.update({
      where: { id },
      data,
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
      where: {
        venueId,
        dayOfWeek,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.operationalHour.delete({
      where: { id },
    });
  }

  async deleteByVenue(venueId: string) {
    return prisma.operationalHour.deleteMany({
      where: { venueId },
    });
  }

  async upsertByDay(
    venueId: string,
    dayOfWeek: number,
    opensAt: number,
    closesAt: number,
  ) {
    const found = await this.findByVenueAndDay(venueId, dayOfWeek);

    if (found) {
      return this.update(found.id, {
        opensAt,
        closesAt,
      });
    }

    return this.create(venueId, {
      dayOfWeek,
      opensAt,
      closesAt,
    });
  }
}
