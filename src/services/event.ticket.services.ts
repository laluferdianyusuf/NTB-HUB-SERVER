import { EventTicketRepository } from "../repositories";
import { TicketStatus } from "@prisma/client";

export class EventTicketService {
  private repo = new EventTicketRepository();

  async scanTicket(qrCode: string, venueId?: string) {
    const ticket = await this.repo.findByQrCode(qrCode);

    if (!ticket) {
      throw new Error("TICKET_NOT_FOUND");
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new Error("TICKET_ALREADY_USED");
    }

    if (venueId && ticket.event.venueId !== venueId) {
      throw new Error("INVALID_VENUE");
    }

    await this.repo.markUsed(ticket.id);

    return ticket;
  }
}
