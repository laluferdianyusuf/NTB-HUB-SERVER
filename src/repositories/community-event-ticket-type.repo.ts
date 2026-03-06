import { Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: Prisma.CommunityEventTicketTypeOrderByWithRelationInput;
}

export class CommunityEventTicketTypeRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: Prisma.CommunityEventTicketTypeCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.communityEventTicketType.create({
      data,
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventTicketType.findUnique({
      where: { id },
    });
  }

  async findActiveByEvent(eventId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).communityEventTicketType.findMany({
      where: {
        communityEventId: eventId,
        isActive: true,
      },
    });
  }

  async incrementSold(
    id: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).communityEventTicketType.update({
      where: { id },
      data: {
        sold: {
          increment: quantity,
        },
      },
    });
  }

  async decrementSold(
    id: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).communityEventTicketType.update({
      where: { id },
      data: {
        sold: {
          decrement: quantity,
        },
      },
    });
  }

  async findMany(
    where: Prisma.CommunityEventTicketTypeWhereInput,
    options?: FindManyOptions,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);

    return client.communityEventTicketType.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
  }

  async count(
    where: Prisma.CommunityEventTicketTypeWhereInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = this.getClient(tx);

    return client.communityEventTicketType.count({
      where,
    });
  }
}
