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
  async findAll(): Promise<User[]> {
    const res = await prisma.user.findMany();

    return res;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
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
