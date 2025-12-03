import { Device, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class DeviceRepository {
  async create(data: Device) {
    return prisma.device.create({ data });
  }

  async registerDevice(data: Device) {
    return await prisma.device.upsert({
      where: { token: data.token },
      update: {
        userId: data.userId,
        platform: data.platform,
        osName: data.osName,
        osVersion: data.osVersion,
        deviceModel: data.deviceModel,
        updatedAt: new Date(),
      },
      create: {
        userId: data.userId,
        token: data.token,
        platform: data.platform,
        osName: data.osName,
        osVersion: data.osVersion,
        deviceModel: data.deviceModel,
      },
    });
  }

  async updateByToken(token: string, data: Device) {
    return prisma.device.update({
      where: { token },
      data,
    });
  }

  async findByToken(token: string) {
    return prisma.device.findUnique({
      where: { token },
    });
  }

  async findByUserId(userId: string) {
    return prisma.device.findMany({
      where: { userId },
    });
  }

  async deleteByToken(token: string) {
    return prisma.device.delete({
      where: { token },
    });
  }
}
