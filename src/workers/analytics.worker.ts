import { Worker } from "bullmq";
import { prisma } from "config/prisma";
import { redis } from "config/redis.config";

new Worker(
  "analytics-queue",
  async (job) => {
    const { userId, event, payload } = job.data;

    await prisma.log.create({
      data: {
        userId,
        action: event,
        description: JSON.stringify(payload),
      },
    });

    return true;
  },
  { connection: redis },
);
