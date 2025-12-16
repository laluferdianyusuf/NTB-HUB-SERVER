import { Device, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class DeviceRepository {
  async create(data: Device) {
    return prisma.device.create({ data });
  }

  async registerDevice(data: Device) {
    return await prisma.device.upsert({
      where: {
        token_userId: {
          token: data.token,
          userId: data.userId!,
        },
      },
      update: {
        platform: data.platform,
        osName: data.osName,
        osVersion: data.osVersion,
        deviceModel: data.deviceModel,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  async findByUserId(userId: string) {
    return prisma.device.findMany({
      where: { userId },
    });
  }
}
