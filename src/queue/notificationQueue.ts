import { Queue } from "bullmq";
import { redis } from "config/redis.config";
import { NotificationJobData } from "types/notification.types";

export const notificationQueue = new Queue<NotificationJobData>(
  "notification-queue",
  {
    connection: redis,
  },
);
