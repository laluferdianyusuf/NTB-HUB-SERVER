import { Job, Worker } from "bullmq";
import { redis } from "config/redis.config";
import { DeviceRepository } from "repositories";
import { NotificationJobData } from "types/notification.types";
import firebase from "../utils/firebase";

const deviceRepo = new DeviceRepository();

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

new Worker<NotificationJobData>(
  "notification-queue",
  async (job: Job<NotificationJobData>) => {
    const { tokens, payload } = job.data;

    if (!tokens?.length) return;

    const chunks = chunkArray(tokens, 500);
    const invalidTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const response = await firebase.messaging().sendEachForMulticast({
          tokens: chunk,
          ...payload,
        });

        console.log(`[Worker FCM] ${response.successCount}/${chunk.length}`);

        response.responses.forEach((res, i) => {
          if (!res.success) {
            const msg = res.error?.message || "";

            if (
              msg.includes("registration-token-not-registered") ||
              msg.includes("invalid-registration-token")
            ) {
              const token = chunk[i];

              if (typeof token === "string") {
                invalidTokens.push(token);
              }
            }
          }
        });
      } catch (err) {
        console.log("[Worker FCM ERROR]", err);
        throw err;
      }
    }

    if (invalidTokens.length) {
      await Promise.all(invalidTokens.map((t) => deviceRepo.deleteByToken(t)));
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);
