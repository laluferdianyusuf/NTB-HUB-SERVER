import { setupRedisSubscriber } from "events/redis.subscriber";
import { app, io, server } from "./app";
const port = process.env.PORT || 3100;
const socketPort = process.env.SOCKET_PORT || 3101;

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

setupRedisSubscriber(io);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.listen(socketPort, () => {
  console.log(
    `Server with Socket.IO running on http://localhost:${socketPort}`
  );
});
