import { PrismaClient, Transaction, TransactionStatus } from "@prisma/client";
const prisma = new PrismaClient();

export class TransactionRepository {
  async create(data: Transaction): Promise<Transaction> {
    return prisma.transaction.create({ data });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<Transaction> {
    return prisma.transaction.findFirst({ where: { orderId } });
  }

  async findAll(): Promise<Transaction[]> {
    return prisma.transaction.findMany();
  }

  async updateStatus(id: string, status: string): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { status: status as TransactionStatus },
    });
  }

  async updateTransaction(
    id: string,
    data: Partial<Transaction>
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  }
}
