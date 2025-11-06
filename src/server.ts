import { app, io, server, Redis } from "./app";
const port = process.env.PORT || 3100;
const socketPort = process.env.PORT || 3101;

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => {
  console.log(`Connected to Redis`);
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.listen(socketPort, () => {
  console.log(
    `Server with Socket.IO running on http://localhost:${socketPort}`
  );
});
