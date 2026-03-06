import { Job, Queue, Worker } from "bullmq";
import { redis } from "config/redis.config";

const redisOptions = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

const queues: Record<string, Queue> = {};

export function getQueue(queueName: string) {
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  return queues[queueName];
}

export async function addDelayedJob<T>(
  queueName: string,
  jobName: string,
  data: T,
  delay: number,
  jobId?: string,
) {
  const queue = getQueue(queueName);

  return queue.add(jobName, data, {
    delay,
    jobId,
  });
}

export async function addJob<T>(
  queueName: string,
  jobName: string,
  data: T,
  jobId?: string,
) {
  const queue = getQueue(queueName);

  return queue.add(jobName, data, {
    jobId,
  });
}

export async function cancelJob(queueName: string, jobId: string) {
  const queue = getQueue(queueName);

  const job = await queue.getJob(jobId);

  if (job) {
    await job.remove();
  }
}

export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<any>,
  concurrency = 5,
) {
  const worker = new Worker(queueName, processor, {
    connection: redis,
    concurrency,
  });

  worker.on("completed", (job) => {
    console.log(`[QUEUE] Job completed: ${job.name}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[QUEUE] Job failed: ${job?.name}`, err);
  });

  return worker;
}

export const pointQueue = new Queue("reward-queue", {
  connection: redis,
});

export const analyticsQueue = new Queue("analytics-queue", {
  connection: redis,
});
