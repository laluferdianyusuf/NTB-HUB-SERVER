import { redis } from "config/redis.config";

export class RateLimiterService {
  async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
  }
}
