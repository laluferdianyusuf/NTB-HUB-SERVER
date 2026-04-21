import { Prisma, PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export type CreateUserInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  emailVerifyToken?: string | null;
  emailVerifyExpiry?: Date | null;
  photo?: string | null;
  googleId?: string | null;
};

export class UserRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client;
  }

  async getUsersByVenue(venueId: string, search?: string) {
    return prisma.user.findMany({
      where: {
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
    });
  }

  async findAllUsers(params?: {
    search?: string;
    limit?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { search, limit, page = 1, pageSize = 10 } = params || {};

    const where: any = {
      isVerified: true,
    };

    if (search && search.trim().length >= 3) {
      const words = search.trim().split(/\s+/);

      where.AND = words.map((word) => ({
        OR: [
          {
            name: {
              contains: word,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: word,
              mode: "insensitive",
            },
          },
        ],
      }));
    }

    return prisma.user.findMany({
      where,
      take: 10,
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        address: true,

        eventOrders: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startAt: true,
                endAt: true,
              },
            },
          },
        },

        communityMemberships: {
          where: { status: "APPROVED" },
          include: {
            community: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async countAllUsers(params?: { search?: string }) {
    const { search } = params || {};

    const where: any = {
      isVerified: true,
    };

    if (search && search.trim().length >= 3) {
      const words = search.trim().split(/\s+/);

      where.AND = words.map((word) => ({
        OR: [
          {
            name: {
              contains: word,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: word,
              mode: "insensitive",
            },
          },
        ],
      }));
    }

    return prisma.user.count({
      where,
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        photo: true,
        email: true,
        address: true,
        profileViewCount: true,
        profileLikeCount: true,
        isVerified: true,
        biometricEnabled: true,
        transactionPin: true,
        pinLockedUntil: true,
        pinFailedCount: true,
        createdAt: true,
      },
    });
  }

  async findUsersWithCommunities(userIds: string[]) {
    return prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      include: {
        communityMemberships: {
          include: {
            community: true,
          },
        },
      },
    });
  }

  async findByIds(ids: string[], tx?: Prisma.TransactionClient) {
    const client = this.transaction(tx);
    return client.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        photo: true,
        email: true,
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByVerifyToken(token: string) {
    return prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        isVerified: false,
        emailVerifyExpiry: {
          gt: new Date(),
        },
      },
    });
  }

  async verifyUser(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    const user = await client.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    await client.account.create({
      data: {
        type: "USER",
        userId: user.id,
      },
    });

    return user;
  }

  async create(
    data: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const client = tx ?? prisma;
    const user = await client.user.create({ data });

    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async updateTransactionPin(
    id: string,
    pin: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    await client.user.update({
      where: { id },
      data: {
        transactionPin: pin,
      },
    });
  }

  async updateBiometric(
    id: string,
    biometric: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.transaction(tx);
    await client.user.update({
      where: { id },
      data: {
        biometricEnabled: biometric,
      },
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }

  async findManyUsers(tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.user.findMany({
      select: { id: true, name: true },
    });
  }

  async findManyUsersByIds(ids: string[], tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;

    return db.user.findMany({
      where: {
        id: { in: ids },
      },
      select: { id: true, name: true, username: true, photo: true },
    });
  }

  findByResetToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: { gt: new Date() },
      },
    });
  }

  setResetToken(userId: string, token: string, expire: Date): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpire: expire,
      },
    });
  }

  updatePasswordAndClearToken(userId: string, password: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });
  }
}
