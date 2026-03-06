import { Prisma } from "@prisma/client";
import { CommunityEventRepository } from "repositories";
import { CommunityEventTicketTypeRepository } from "../repositories/community-event-ticket-type.repo";

interface CreateTicketTypePayload {
  actorId: string;
  communityEventId: string;
  name: string;
  price: number;
  quota: number;
  description?: string;
}

interface FindAllTicketTypesParams {
  actorId?: string;
  communityEventId: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "price" | "createdAt" | "quota";
  sortOrder?: "asc" | "desc";
}

export class CommunityEventTicketTypeService {
  private ticketTypeRepo = new CommunityEventTicketTypeRepository();
  private communityEventRepo = new CommunityEventRepository();

  async createTicketType(payload: CreateTicketTypePayload) {
    const { actorId, communityEventId, name, price, quota, description } =
      payload;

    if (price <= 0) {
      throw new Error("Ticket price must be greater than 0");
    }

    if (quota <= 0) {
      throw new Error("Ticket quota must be greater than 0");
    }

    const event = await this.communityEventRepo.findById(communityEventId);

    if (!event) {
      throw new Error("Community event not found");
    }

    if (!["DRAFT", "UPCOMING"].includes(event.status)) {
      throw new Error("Cannot create ticket type for this event status");
    }

    if (event.createdById !== actorId) {
      throw new Error("You are not allowed to manage this event");
    }

    const existing =
      await this.ticketTypeRepo.findActiveByEvent(communityEventId);

    if (existing) {
      throw new Error("Ticket type with this name already exists");
    }

    return this.ticketTypeRepo.create({
      communityEvent: { connect: { id: communityEventId } },
      name,
      price,
      quota,
      description,
      sold: 0,
      isActive: true,
    });
  }

  async findAllTicketTypes(params: FindAllTicketTypesParams) {
    const {
      actorId,
      communityEventId,
      includeInactive = false,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = params;

    const event = await this.communityEventRepo.findById(communityEventId);

    if (!event) {
      throw new Error("Community event not found");
    }

    const isOwner = actorId && actorId === event.createdById;

    if (!isOwner && event.status !== "UPCOMING") {
      throw new Error("Event not available");
    }

    const where: Prisma.CommunityEventTicketTypeWhereInput = {
      communityEventId,
    };

    if (!isOwner || !includeInactive) {
      where.isActive = true;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.ticketTypeRepo.findMany(where, {
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.ticketTypeRepo.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
