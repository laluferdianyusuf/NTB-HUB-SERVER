import { PrismaClient, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class EventTicketRepository {
  findByQrCode(qrCode: string) {
    return prisma.eventTicket.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: true,
        ticketType: true,
      },
    });
  }

  markUsed(id: string) {
    return prisma.eventTicket.update({
      where: { id },
      data: {
        status: TicketStatus.USED,
        usedAt: new Date(),
      },
    });
  }
}
