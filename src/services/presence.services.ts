import { redisCache } from "config/redis.config";
import { PresenceRepository } from "repositories";

type ContextType = "global" | "event" | "place";
interface ContextInfo {
  type: ContextType;
  id?: string; // eventId atau placeId
}

export class PresenceService {
  private repo = new PresenceRepository();
  private TTL = 90 * 1000; // 90 detik dalam ms

  private key(context: string, contextId?: string) {
    return `online:${context}:${contextId ?? "global"}`;
  }

  private geoKey(context: string, contextId?: string) {
    return `geo:${context}:${contextId ?? "global"}`;
  }

  async heartbeat(
    userId: string,
    context: string,
    latitude: number,
    longitude: number,
    contextId?: string,
  ) {
    const onlineKey = this.key(context, contextId);
    const geoKey = this.geoKey(context, contextId);

    const now = Date.now();
    const expired = now - this.TTL;

    await redisCache
      .multi()
      .zremrangebyscore(onlineKey, 0, expired)
      .zadd(onlineKey, now, userId)
      .geoadd(geoKey, longitude, latitude, userId)
      .exec();

    await this.repo.upsert(userId, context, contextId);
  }

  async getNearbyOnlineUsers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    context: string,
    contextId?: string,
  ) {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return [];
    }

    const onlineKey = this.key(context, contextId);
    const geoKey = this.geoKey(context, contextId);

    const now = Date.now();
    const expired = now - this.TTL;

    await redisCache.zremrangebyscore(onlineKey, 0, expired);

    const nearby = (await redisCache.georadius(
      geoKey,
      longitude,
      latitude,
      radiusKm,
      "km",
    )) as string[];

    if (!nearby?.length) return [];

    const onlineUsers = await redisCache.zrange(onlineKey, 0, -1);

    const onlineSet = new Set(onlineUsers);

    return nearby.filter((id) => onlineSet.has(id));
  }

  async markOffline(userId: string, context: string, contextId?: string) {
    await redisCache
      .multi()
      .zrem(this.key(context, contextId), userId) // ZSET
      .zrem(this.geoKey(context, contextId), userId) // GEO
      .exec();
  }

  async countOnline(context: string, contextId?: string) {
    const now = Date.now();
    const expired = now - this.TTL;

    const onlineKey = this.key(context, contextId);

    await redisCache.zremrangebyscore(onlineKey, 0, expired);

    return redisCache.zcard(onlineKey);
  }

  async listOnline(context: string, contextId?: string) {
    return redisCache.zrange(this.key(context, contextId), 0, -1);
  }
}
