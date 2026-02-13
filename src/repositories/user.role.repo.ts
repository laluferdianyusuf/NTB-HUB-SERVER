import { Prisma, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export class UserRoleRepository {
  private db(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async assignVenueRole(
    params: {
      userId: string;
      venueId: string;
      role: Role;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.upsert({
      where: {
        userId_role_venueId: {
          userId: params.userId,
          role: params.role,
          venueId: params.venueId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        userId: params.userId,
        role: params.role,
        venueId: params.venueId,
      },
    });
  }

  async assignEventRole(
    params: {
      userId: string;
      eventId: string;
      role: Role;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.upsert({
      where: {
        userId_role_eventId: {
          userId: params.userId,
          role: params.role,
          eventId: params.eventId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        userId: params.userId,
        role: params.role,
        eventId: params.eventId,
      },
    });
  }

  async revokeRole(id: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.userRole.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignGlobalRole(
    params: {
      userId: string;
      role: Role;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.upsert({
      where: {
        userId_role: {
          userId: params.userId,
          role: params.role,
        },
      },
      update: { isActive: true },
      create: {
        userId: params.userId,
        role: params.role,
      },
    });
  }

  async revokeGlobalRole(
    userId: string,
    role: Role,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.updateMany({
      where: {
        userId,
        role,
        venueId: null,
        eventId: null,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  async getVenueRole(
    userId: string,
    venueId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.findFirst({
      where: {
        userId,
        venueId,
        isActive: true,
      },
    });
  }

  async findAdmins(tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.userRole.findMany({
      where: {
        role: Role.ADMIN,
        isActive: true,
      },
      include: {
        user: {
          include: { devices: true },
        },
      },
    });
  }

  async getEventRole(
    userId: string,
    eventId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.findFirst({
      where: {
        userId,
        eventId,
        isActive: true,
      },
    });
  }

  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const db = this.db(tx);

    return db.userRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        assignedAt: "asc",
      },
    });
  }

  async hasRole(
    params: {
      userId: string;
      role: Role;
      venueId?: string;
      eventId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.db(tx);

    return db.userRole.findFirst({
      where: {
        userId: params.userId,
        role: params.role,
        ...(params.venueId && { venueId: params.venueId }),
        ...(params.eventId && { eventId: params.eventId }),
        isActive: true,
      },
    });
  }

  async findUsersByRole(role: Role) {
    return prisma.userRole.findMany({
      where: { role, isActive: true },
      include: {
        user: {
          include: { devices: true },
        },
      },
    });
  }

  async findUsersByRoleAndAdmin(role: Role, userId: string) {
    return prisma.userRole.findMany({
      where: {
        role_userId: {
          role,
          userId,
        },
        isActive: true,
      },
      include: {
        user: {
          include: { devices: true },
        },
      },
    });
  }

  async findUsersByRoleAndVenue(role: Role, venueId: string) {
    return prisma.userRole.findMany({
      where: {
        role_venueId: {
          role,
          venueId,
        },
        isActive: true,
      },
      include: {
        user: {
          include: { devices: true },
        },
      },
    });
  }

  async findUsersByRoleAndEvent(role: Role, eventId: string) {
    return prisma.userRole.findMany({
      where: {
        role_eventId: {
          role,
          eventId,
        },
        isActive: true,
      },
      include: {
        user: {
          include: { devices: true },
        },
      },
    });
  }
}
