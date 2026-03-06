import { Queue } from "bullmq";
import { redis } from "config/redis.config";

export const promotionQueue = new Queue("promotion-analytics", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
