import { EventRepository } from "../repositories";
import { EventStatus } from "@prisma/client";

export class EventService {
  private repo = new EventRepository();

  async createEvent(payload: {
    venueId: string;
    name: string;
    description: string;
    image?: string;
    startAt: Date;
    endAt: Date;
    capacity?: number;
  }) {
    if (payload.endAt <= payload.startAt) {
      throw new Error("INVALID_EVENT_TIME");
    }

    return this.repo.create(payload);
  }

  async getEvents() {
    return this.repo.findAllActive();
  }

  async getEventDetail(eventId: string) {
    const event = await this.repo.findById(eventId);
    if (!event || !event.isActive) {
      throw new Error("EVENT_NOT_FOUND");
    }
    return event;
  }

  async changeStatus(eventId: string, status: EventStatus) {
    return this.repo.updateStatus(eventId, status);
  }

  async deleteEvent(eventId: string) {
    return this.repo.delete(eventId);
  }
}
