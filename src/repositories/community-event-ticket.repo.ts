import { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "config/prisma";

export class CommunityEventTicketRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async createMany(
    data: Prisma.CommunityEventTicketCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).communityEventTicket.createMany({
      data,
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.communityEventTicket.findUnique({
      where: { id },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.communityEventTicket.findMany({
      where: { userId },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  findByOrderId(orderId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.communityEventTicket.findMany({
      where: { orderId },
      include: {
        user: true,
        event: true,
        ticketType: true,
        order: true,
      },
    });
  }

  async findByQrCode(qrCode: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventTicket.findUnique({
      where: { qrCode },
    });
  }

  markAsUsed(ticketId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.communityEventTicket.updateMany({
      where: {
        id: ticketId,
        status: "ACTIVE",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });
  }

  async expireTicketsByOrder(orderId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventTicket.updateMany({
      where: {
        orderId,
        status: TicketStatus.ACTIVE,
      },
      data: {
        status: TicketStatus.EXPIRED,
      },
    });
  }
}
