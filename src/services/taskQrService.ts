import { redisCache } from "config/redis.config";

export class TaskQrRedisService {
  private prefix = "task:qr:";

  async set(token: string, taskId: string, ttlSeconds: number) {
    await redisCache.set(this.prefix + token, taskId, "EX", ttlSeconds);
    console.log("SET KEY:", this.prefix + token);
    console.log("TTL:", ttlSeconds);
  }

  async get(token: string) {
    return redisCache.get(this.prefix + token);
  }

  async consume(token: string) {
    await redisCache.del(this.prefix + token);
  }
}
