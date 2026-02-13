import Redis from "ioredis";

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

export const redisCache = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

export const publisher = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

export const subscriber = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redisCache.on("connect", () => console.log("Redis Cache connected"));
publisher.on("connect", () => console.log("Redis Publisher connected"));
subscriber.on("connect", () => console.log("Redis Subscriber connected"));
