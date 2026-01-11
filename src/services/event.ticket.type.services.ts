import { EventTicketTypeRepository } from "../repositories";

export class EventTicketTypeService {
  private repo = new EventTicketTypeRepository();

  async createTicketType(input: {
    eventId: string;
    name: string;
    price: number;
    quota: number;
  }) {
    if (input.price <= 0) throw new Error("INVALID_PRICE");
    if (input.quota <= 0) throw new Error("INVALID_QUOTA");

    return this.repo.create(input);
  }

  async getByEvent(eventId: string) {
    return this.repo.findByEvent(eventId);
  }

  async updateTicketType(
    id: string,
    data: {
      name?: string;
      price?: number;
      quota?: number;
      isActive?: boolean;
    }
  ) {
    return this.repo.update(id, data);
  }

  async deleteTicketType(id: string) {
    return this.repo.delete(id);
  }
}
