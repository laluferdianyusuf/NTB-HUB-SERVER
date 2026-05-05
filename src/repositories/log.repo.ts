import {
  ActivityAction,
  ActivityEntityType,
  ActorType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export class ActivityLogRepository {
  async create(
    data: {
      actorId?: string;
      actorType?: ActorType;

      entityType: ActivityEntityType;
      entityId: string;

      action: ActivityAction;
      metadata?: JsonObject;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.activityLog.create({
      data: {
        actorId: data.actorId,
        actorType: data.actorType,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        metadata: data.metadata,
      },
    });
  }

  async createMany(
    logs: {
      actorId?: string;
      actorType?: ActorType;

      entityType: ActivityEntityType;
      entityId: string;

      action: ActivityAction;
      metadata?: JsonObject;
    }[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.activityLog.createMany({
      data: logs.map((log) => ({
        actorId: log.actorId,
        actorType: log.actorType,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        metadata: log.metadata,
      })),
    });
  }

  async findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({
        where: { entityType, entityId },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByActor(
    actorId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { actorId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({
        where: { actorId },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.entityType) {
      where.entityType = params.entityType;
    }

    if (params?.action) {
      where.action = params.action;
    }

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
