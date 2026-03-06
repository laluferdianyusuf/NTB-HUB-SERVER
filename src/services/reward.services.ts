import { PointActivityType } from "@prisma/client";
import { analyticsQueue, pointQueue } from "queue";
import { PointsRepository } from "repositories";

export class PointQueueService {
  private pointRepo = new PointsRepository();
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

    await this.pointRepo.generatePoints({
      userId: params.userId,
      activity: params.activity,
      points: params.points,
      reference: params.reference,
    });

    await analyticsQueue.add("track-event", {
      userId: params.userId,
      event: "point_queued",
      payload: params,
    });
  }
}
