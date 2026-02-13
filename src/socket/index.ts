import { Server } from "socket.io";
import { registerPresenceSocket } from "./presence.socket";
import { setupRedisSubscriber } from "events/redis.subscriber";
import { socketAuth } from "./auth";
import { registerLocationSocket } from "./location.socket";

export const initSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket"],
  });

  io.use(socketAuth);

  setupRedisSubscriber(io);

  io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED:", (socket as any).user.sub);
    registerPresenceSocket(io, socket);
    registerLocationSocket(io, socket);
  });

  return io;
};
