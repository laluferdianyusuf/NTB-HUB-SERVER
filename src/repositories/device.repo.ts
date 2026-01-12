import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class DeviceRepository {
  // Create device baru
  async create(data: Prisma.DeviceCreateInput) {
    return prisma.device.create({ data });
  }

  async registerDevice(data: {
    token: string;
    expoToken: string;
    platform?: string;
    osName?: string;
    osVersion?: string;
    deviceModel?: string;
    userId?: string; // optional
    venueId?: string;
  }) {
    if (data.userId) {
      return prisma.device.upsert({
        where: {
          token_userId: {
            token: data.token,
            userId: data.userId,
          },
        },
        update: {
          platform: data.platform,
          osName: data.osName,
          osVersion: data.osVersion,
          deviceModel: data.deviceModel,
          expoToken: data.expoToken,
          updatedAt: new Date(),
        },
        create: {
          token: data.token,
          expoToken: data.expoToken,
          platform: data.platform,
          osName: data.osName,
          osVersion: data.osVersion,
          deviceModel: data.deviceModel,
          user: { connect: { id: data.userId } },
          venue: data.venueId ? { connect: { id: data.venueId } } : undefined,
        },
      });
    } else {
      const existing = await prisma.device.findFirst({
        where: { token: data.token },
      });

      if (existing) {
        return prisma.device.update({
          where: { id: existing.id },
          data: {
            platform: data.platform,
            osName: data.osName,
            osVersion: data.osVersion,
            deviceModel: data.deviceModel,
            expoToken: data.expoToken,
            updatedAt: new Date(),
          },
        });
      } else {
        return prisma.device.create({
          data: {
            token: data.token,
            expoToken: data.expoToken,
            platform: data.platform,
            osName: data.osName,
            osVersion: data.osVersion,
            deviceModel: data.deviceModel,
          },
        });
      }
    }
  }

  async findByUserId(userId: string) {
    return prisma.device.findMany({
      where: { userId, expoToken: { not: null } },
    });
  }

  async findByVenueId(venueId: string) {
    return prisma.device.findMany({
      where: { venueId, expoToken: { not: null } },
    });
  }

  async findAdmins() {
    return prisma.device.findMany({
      where: { user: { role: "ADMIN" } },
      include: { user: true },
    });
  }

  async deleteByToken(token: string) {
    return prisma.device.deleteMany({ where: { token } });
  }

  async findAllForPush() {
    return prisma.device.findMany({
      where: { expoToken: { not: null } },
    });
  }
}
