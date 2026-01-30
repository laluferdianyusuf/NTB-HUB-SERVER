import { PrismaClient, WithdrawStatus } from "@prisma/client";

export class WithdrawRepository {
  constructor(private prisma = new PrismaClient()) {}

  create(data: {
    venueId: string;
    withdrawNumber: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankCode: string;
    bankAccount: string;
    accountName: string;
    note?: string;
  }) {
    return this.prisma.withdrawRequest.create({ data });
  }

  findById(id: string) {
    return this.prisma.withdrawRequest.findUnique({ where: { id } });
  }

  findByVenue(venueId: string) {
    return this.prisma.withdrawRequest.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
    });
  }

  findAll() {
    return this.prisma.withdrawRequest.findMany({
      include: { venue: true },
      orderBy: { createdAt: "desc" },
    });
  }

  updateStatus(
    id: string,
    status: WithdrawStatus,
    dateField?: "approvedAt" | "paidAt",
  ) {
    return this.prisma.withdrawRequest.update({
      where: { id },
      data: {
        status,
        ...(dateField ? { [dateField]: new Date() } : {}),
      },
    });
  }
}
