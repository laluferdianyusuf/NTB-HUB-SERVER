import { publisher } from "config/redis.config";

export const publishEvent = (channel: string, event: string, payload: any) => {
  publisher.publish(
    channel,
    JSON.stringify({
      event,
      payload,
    }),
  );
};
