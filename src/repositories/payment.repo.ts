import { Prisma, TransactionStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export class PaymentRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: {
      invoiceId: string;
      amount: number;
      method?: string;
      provider?: string;
      providerRef?: string;
      vaNumber?: string;
      bankCode?: string;
      qrisUrl?: string;
      expiredAt?: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);
    return client.payment.create({ data });
  }

  async findByProviderRef(providerRef: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.payment.findFirst({
      where: { providerRef },
      include: {
        invoice: {
          select: {
            entityId: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string, cursor?: string, limit = 20) {
    return prisma.payment.findMany({
      where: {
        invoice: {
          entityId: userId,
          entityType: "TOPUP",
        },
      },
      include: {
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: {
        id: id,
      },
      include: {
        invoice: true,
      },
    });
  }

  async markSuccess(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.payment.update({
      where: { id },
      data: { status: TransactionStatus.SUCCESS },
      include: {
        invoice: true,
      },
    });
  }

  async markFailed(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.payment.update({
      where: { id },
      data: { status: TransactionStatus.FAILED },
      include: {
        invoice: true,
      },
    });
  }

  async markExpired(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.payment.update({
      where: { id },
      data: { status: TransactionStatus.EXPIRED },
      include: {
        invoice: true,
      },
    });
  }

  async findActiveByInvoice(invoiceId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.payment.findFirst({
      where: {
        invoiceId,
        status: TransactionStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
