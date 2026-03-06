import { prisma } from "config/prisma";
import { publisher } from "config/redis.config";
import jwt from "jsonwebtoken";
import {
  EventAttendanceRepository,
  EventTicketRepository,
} from "../repositories";

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class EventTicketService {
  private repo = new EventTicketRepository();
  private attendanceRepo = new EventAttendanceRepository();

  async scanTicket(qrCode: string) {
    let payload: any;

    try {
      payload = jwt.verify(qrCode, process.env.QR_SECRET!);
    } catch {
      throw new Error("INVALID_QR_CODE");
    }

    const ticket = await this.repo.findById(payload.tid);

    if (!ticket) throw new Error("TICKET_NOT_FOUND");
    if (ticket.userId !== payload.uid) throw new Error("INVALID_OWNER");

    return {
      id: ticket.id,
      status: ticket.status,
      user: ticket.user,
      event: ticket.event,
      ticketType: ticket.ticketType,
    };
  }

  async verifyTicket(ticketId: string, eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await this.attendanceRepo.findOne(eventId, userId, tx);

      if (existing) throw new Error("User already checked in for this event");

      await this.attendanceRepo.attendanceWithTicket(
        eventId,
        userId,
        ticketId,
        tx,
      );

      const result = await this.repo.markAsUsed(ticketId, tx);

      if (result.count === 0) {
        throw new Error("TICKET_ALREADY_USED");
      }

      publishEvent("event-attendance", "ticket:verified", {
        eventId,
        userId,
        ticketId,
      });
      return { success: true };
    });
  }

  async getTicketById(id: string) {
    const result = await this.repo.findById(id);

    return result;
  }

  async getTicketByUserId(userId: string) {
    const result = await this.repo.findByUserId(userId);

    return result;
  }

  async getTicketByOrderId(orderId: string) {
    const result = await this.repo.findByOrderId(orderId);

    return result;
  }
}
