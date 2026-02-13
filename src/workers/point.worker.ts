import { Worker } from "bullmq";
import { prisma } from "config/prisma";
import { redis } from "config/redis.config";
import { analyticsQueue } from "queue";

new Worker(
  "point-queue",
  async (job) => {
    const { userId, activity, points, reference } = job.data;

    const exists = await prisma.point.findFirst({
      where: {
        userId,
        activity,
        reference,
      },
    });

    if (exists) {
      return { skipped: true };
    }

    await prisma.point.create({
      data: {
        userId,
        activity,
        points,
        reference,
      },
    });

    await analyticsQueue.add("track-event", {
      userId,
      event: "point_granted",
      payload: { activity, points, reference },
    });

    return { success: true };
  },
  { connection: redis },
);
