import { uploadImage } from "utils/uploadS3";
import { CommunityEventRepository, EventRepository } from "../repositories";
import { Community, EventStatus, User, Venue } from "@prisma/client";
import { toNum } from "helpers/parser";

export type UnifiedEvent = {
  id: string;
  title: string;
  startAt: Date;
  location: string | null;
  description?: string | null;
  type: "EVENT" | "COMMUNITY";
  venue?: Venue;
  community?: Community;
  createdBy?: User;
};

export class EventService {
  private repo = new EventRepository();
  private communityEventRepo = new CommunityEventRepository();

  async createEvent(
    payload: {
      venueId?: string;
      name: string;
      description: string;
      image?: string;
      startAt: Date;
      endAt: Date;
      capacity?: number;
      location: string;
      isCommunity?: boolean;
      isVenue?: boolean;
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
      capacity: toNum(payload.capacity) as number,
      image: imageUrl as string,
    });
  }

  async getAllEvents(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 10 } = params;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repo.findAllActiveEvents({
        status,
        search,
        skip,
        take: limit,
      }),
      this.repo.countEvents({ status, search }),
    ]);

    const shapedData = data.map((event) => ({
      id: event.id,
      name: event.name,
      status: event.status,
      location: event.location,
      description: event.description,
      image: event.image,
      startAt: event.startAt,
      endAt: event.endAt,
      capacity: event.capacity,
      updatedAt: event.updatedAt, // ✅ FIX
    }));

    return {
      data: shapedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMergedEvents(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 10 } = params;

    const skip = (page - 1) * limit;

    const [events, communityEvents] = await Promise.all([
      this.repo.findAllActiveEvents({ search, status, skip, take: limit }),
      this.communityEventRepo.findCommunityEvents({
        search,
        skip,
        take: limit,
      }),
    ]);

    const normalizedEvents = events.map((e) => ({
      id: e.id,
      title: e.name,
      startAt: e.startAt,
      location: e.location,
      image: e.image,
      description: e.description,
      status: e.status,
      venue: e.venue,
      community: e.community,
      type: "EVENT" as const,
    }));

    const normalizedCommunity = communityEvents.map((c) => ({
      id: c.id,
      title: c.title,
      startAt: c.startAt,
      location: c.location,
      status: c.status,
      image: c.image,
      description: c.description,
      createdBy: c.createdBy,
      community: c.community,
      type: "COMMUNITY" as const,
    }));

    const shapedData = [...normalizedEvents, ...normalizedCommunity].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );

    return {
      data: shapedData,
      meta: {
        page,
        limit,
      },
    };
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
