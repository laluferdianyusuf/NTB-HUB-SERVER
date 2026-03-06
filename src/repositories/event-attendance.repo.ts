import { CheckInMethod, EventAttendance, Prisma } from "@prisma/client";
import { prisma } from "config/prisma";

type Tx = Prisma.TransactionClient;

export class EventAttendanceRepository {
  private getClient(tx?: Tx) {
    return tx ?? prisma;
  }

  async attendance(
    eventId: string,
    userId: string,
    tx?: Tx,
  ): Promise<EventAttendance> {
    const client = this.getClient(tx);

    return client.eventAttendance.create({
      data: {
        eventId,
        userId,
        checkInMethod: CheckInMethod.MANUAL,
      },
    });
  }

  async attendanceWithTicket(
    eventId: string,
    userId: string,
    ticketId: string,
    tx?: Tx,
  ): Promise<EventAttendance> {
    const client = this.getClient(tx);

    return client.eventAttendance.create({
      data: {
        eventId,
        userId,
        ticketId,
        checkInMethod: CheckInMethod.TICKET,
      },
    });
  }

  async findOne(
    eventId: string,
    userId: string,
    tx?: Tx,
  ): Promise<EventAttendance | null> {
    const client = this.getClient(tx);

    return client.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async findByEvent(eventId: string, tx?: Tx): Promise<EventAttendance[]> {
    const client = this.getClient(tx);

    return client.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: true,
        ticket: true,
      },
      orderBy: { checkedInAt: "desc" },
    });
  }

  async findByUser(userId: string, tx?: Tx): Promise<EventAttendance[]> {
    const client = this.getClient(tx);

    return client.eventAttendance.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: { checkedInAt: "desc" },
    });
  }

  async countByEvent(eventId: string, tx?: Tx): Promise<number> {
    const client = this.getClient(tx);

    return client.eventAttendance.count({
      where: { eventId },
    });
  }

  async delete(eventId: string, userId: string, tx?: Tx): Promise<void> {
    const client = this.getClient(tx);

    await client.eventAttendance.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }
}
