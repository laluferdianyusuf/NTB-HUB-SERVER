import { Queue } from "bullmq";
import { redis } from "config/redis.config";

const ASSIGN_QUEUE = "assign-delivery";

export const assignQueue = new Queue(ASSIGN_QUEUE, {
  connection: redis,
});

export const dispatchAssignDelivery = async (deliveryId: string) => {
  await assignQueue.add(
    "assign-delivery",
    { deliveryId },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
};
