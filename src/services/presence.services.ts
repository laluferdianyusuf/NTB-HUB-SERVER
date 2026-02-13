import { redisCache } from "config/redis.config";
import { PresenceRepository } from "repositories";

export class PresenceService {
  private repo = new PresenceRepository();
  private TTL = 90;

  private key(context: string, contextId?: string) {
    return `online:${context}:${contextId ?? "global"}`;
  }

  async heartbeat(userId: string, context: string, contextId?: string) {
    const key = this.key(context, contextId);

    await redisCache.multi().sadd(key, userId).expire(key, this.TTL).exec();

    await this.repo.upsert(userId, context, contextId);
  }

  async markOffline(userId: string, context: string, contextId?: string) {
    await redisCache.srem(this.key(context, contextId), userId);
  }

  async countOnline(context: string, contextId?: string) {
    return redisCache.scard(this.key(context, contextId));
  }

  async listOnline(context: string, contextId?: string) {
    return redisCache.smembers(this.key(context, contextId));
  }
}
