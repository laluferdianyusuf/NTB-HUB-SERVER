import { prisma } from "config/prisma";

export class CourierEarningsRepository {
  async createOrUpdatePeriod(
    courierId: string,
    periodStart: Date,
    periodEnd: Date,
    earning: number,
  ) {
    const existing = await prisma.courierEarnings.findFirst({
      where: {
        courierId,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      return prisma.courierEarnings.update({
        where: { id: existing.id },
        data: {
          totalTrips: { increment: 1 },
          totalEarnings: { increment: earning },
        },
      });
    }

    return prisma.courierEarnings.create({
      data: {
        courierId,
        periodStart,
        periodEnd,
        totalTrips: 1,
        totalEarnings: earning,
      },
    });
  }

  async getByCourier(courierId: string) {
    return prisma.courierEarnings.findMany({
      where: { courierId },
      orderBy: { periodStart: "desc" },
    });
  }
}
