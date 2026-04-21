import { Job, Queue, QueueEvents, Worker } from "bullmq";
import { redis } from "config/redis.config";
import { CourierService } from "services/courier.services";

let courierService: CourierService;

function getCourierServices() {
  if (!courierService) courierService = new CourierService();
  return courierService;
}

const ASSIGN_QUEUE = "assign-delivery";
const TIMEOUT_QUEUE = "assignment-timeout";

export const assignQueue = new Queue(ASSIGN_QUEUE, {
  connection: redis,
});

export const timeoutQueue = new Queue(TIMEOUT_QUEUE, {
  connection: redis,
});

const assignQueueEvents = new QueueEvents(ASSIGN_QUEUE, {
  connection: redis,
});

assignQueueEvents.on("completed", ({ jobId }) => {
  console.log(`[ASSIGN COMPLETED] Job ${jobId}`);
});

assignQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`[ASSIGN FAILED] Job ${jobId}: ${failedReason}`);
});

const courierServices = getCourierServices();

export const assignWorker = new Worker(
  ASSIGN_QUEUE,
  async (job: Job) => {
    const { deliveryId } = job.data;

    console.log(`[ASSIGN] Processing delivery ${deliveryId}`);

    try {
      const result = await courierServices.assignDelivery(deliveryId);

      if (result.success) {
        console.log(
          `[ASSIGN SUCCESS] Delivery ${deliveryId} -> Courier ${result.courierId}`,
        );

        await timeoutQueue.add(
          "assignment-timeout",
          { deliveryId },
          {
            delay: 30000,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          },
        );

        return result;
      }
    } catch (error: any) {
      console.error(`[ASSIGN ERROR] ${deliveryId}`, error.message);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);

export const timeoutWorker = new Worker(
  TIMEOUT_QUEUE,
  async (job: Job) => {
    const { deliveryId } = job.data;

    console.log(`[TIMEOUT CHECK] Delivery ${deliveryId}`);

    try {
      const result = await courierServices.handleAssignmentTimeout(deliveryId);

      if (result?.reassign) {
        console.log(`[REASSIGN] Delivery ${deliveryId}`);

        await timeoutQueue.add(
          "assign-delivery",
          { deliveryId },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 3000,
            },
          },
        );

        return result;
      }
    } catch (error: any) {
      console.error(`[TIMEOUT ERROR] ${deliveryId}`, error.message);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);
