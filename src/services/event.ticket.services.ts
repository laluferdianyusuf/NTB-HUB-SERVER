import { EventTicketRepository } from "../repositories";
import jwt from "jsonwebtoken";

export class EventTicketService {
  private repo = new EventTicketRepository();

  async scanTicket(qrCode: string) {
    let payload;

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

  async verifyTicket(ticketId: string) {
    const result = await this.repo.markAsUsed(ticketId);

    if (result.count === 0) {
      throw new Error("TICKET_ALREADY_USED");
    }

    return { success: true };
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
