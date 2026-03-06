import { Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

export class VirtualAccountRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async findByUserAndBank(
    userId: string,
    bank: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.userVirtualAccount.findUnique({
      where: {
        userId_bank: {
          userId,
          bank,
        },
      },
    });
  }

  async create(
    data: { userId: string; bank: string; vaNumber: string },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.userVirtualAccount.create({
      data,
    });
  }

  async deactivate(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.userVirtualAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
