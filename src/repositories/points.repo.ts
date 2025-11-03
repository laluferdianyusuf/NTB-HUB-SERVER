import { Point, Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class PointsRepository {
  async generatePoints(data: Point): Promise<Point> {
    return await prisma.point.create({ data });
  }

  async getPointsByUserId(userId: string): Promise<Point[] | []> {
    return prisma.point.findMany({ where: { userId } });
  }

  async getTotalPoints(userId: string): Promise<number> {
    const result = await prisma.point.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result._sum.points || 0;
  }
}
