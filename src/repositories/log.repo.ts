import { PrismaClient, Log } from "@prisma/client";
const prisma = new PrismaClient();

export class LogRepository {
  async findById(id: string): Promise<Log | null> {
    return prisma.log.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Log[]> {
    return prisma.log.findMany({ where: { userId } });
  }

  async findAll(): Promise<Log[]> {
    return prisma.log.findMany();
  }
}
