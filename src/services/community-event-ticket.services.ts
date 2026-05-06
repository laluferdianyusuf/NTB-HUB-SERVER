import { publisher } from "config/redis.config";
import { CommunityEventTicketRepository } from "../repositories";

const publishEvent = (channel: string, event: string, payload: any) =>
  publisher.publish(channel, JSON.stringify({ event, payload }));

export class CommunityEventTicketService {
  private repo = new CommunityEventTicketRepository();

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
