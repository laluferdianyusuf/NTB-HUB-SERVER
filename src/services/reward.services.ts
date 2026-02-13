import { PointActivityType } from "@prisma/client";
import { analyticsQueue, pointQueue } from "queue";

export class PointQueueService {
  async givePoint(params: {
    userId: string;
    activity: PointActivityType;
    points: number;
    reference?: string;
  }) {
    const jobId = `point:${params.userId}:${params.activity}:${params.reference}`;

    await pointQueue.add("grant-point", params, {
      jobId,
      removeOnComplete: true,
      attempts: 3,
    });

    await analyticsQueue.add("track-event", {
      userId: params.userId,
      event: "point_queued",
      payload: params,
    });
  }
}
