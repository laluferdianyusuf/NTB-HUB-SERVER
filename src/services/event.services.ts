import { uploadImage } from "utils/uploadS3";
import { EventRepository } from "../repositories";
import { EventStatus } from "@prisma/client";
import { toNum } from "helpers/parser";

export class EventService {
  private repo = new EventRepository();

  async createEvent(
    payload: {
      venueId?: string;
      ownerId: string;
      name: string;
      description: string;
      image?: string;
      startAt: Date;
      endAt: Date;
      capacity?: number;
      location: string;
    },
    file: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "events" });
      imageUrl = image.url;
    }

    if (payload.endAt <= payload.startAt) {
      throw new Error("INVALID_EVENT_TIME");
    }

    return this.repo.createEvent({
      ...payload,
      capacity: toNum(payload.capacity),
      image: imageUrl,
    });
  }

  async getEvents() {
    return this.repo.findAllActiveEvents();
  }

  async getEventDetail(eventId: string) {
    const event = await this.repo.findEventById(eventId);
    if (!event || !event.isActive) {
      throw new Error("EVENT_NOT_FOUND");
    }
    return event;
  }

  async changeStatus(eventId: string, status: EventStatus) {
    return this.repo.updateEventStatus(eventId, status);
  }

  async deleteEvent(eventId: string) {
    return this.repo.deleteEvent(eventId);
  }
}
