import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OperationalRepository {
  async getOperationalHours(venueId: string) {
    return await prisma.operationalHour.findMany({
      where: { venueId },
    });
  }
}
