import { Prisma, PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  photo?: string | null;
  googleId?: string | null;
};

export class UserRepository {
  private transaction(tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client;
  }
  async findAllUsers() {
    return prisma.user.findMany({
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

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        photo: true,
        email: true,
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

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(
    data: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const db = tx ?? prisma;
    return db.user.create({ data });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
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
}
