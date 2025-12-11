import { subscriber } from "config/redis.config";
import { Server } from "socket.io";

export const setupRedisSubscriber = (io: Server) => {
  const channels = [
    "booking-events",
    "user-events",
    "payment-events",
    "transactions-events",
    "order-events",
    "menu-events",
    "review-events",
    "venue-events",
    "points-events",
    "notification-events",
    "tables-events",
    "balance-events",
    "invoice-events",
  ];

  subscriber.subscribe(...channels);

  subscriber.on("message", (channel, message) => {
    const data = JSON.parse(message);

    console.log(`[${channel}] -> ${data.event}`);

    io.emit(data.event, data.payload);
  });

  subscriber.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });
};
