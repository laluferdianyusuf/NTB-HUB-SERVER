import { Queue, Worker, Job } from "bullmq";
import { redis } from "config/redis.config";

const redisOptions = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

const queues: Record<string, Queue> = {};

export function getQueue(queueName: string) {
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, { connection: redisOptions });
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
  await queue.add(jobName, data, {
    delay,
    jobId,
    removeOnComplete: true,
    removeOnFail: true,
  });
}

export async function cancelJob(queueName: string, jobId: string) {
  const queue = getQueue(queueName);
  const job = await queue.getJob(jobId);
  if (job) await job.remove();
}

export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>,
) {
  return new Worker(queueName, processor, { connection: redisOptions });
}

export const pointQueue = new Queue("reward-queue", {
  connection: redis,
});

export const analyticsQueue = new Queue("analytics-queue", {
  connection: redis,
});
