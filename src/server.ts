import { app, server } from "./app";
const port = process.env.PORT || 3100;
const socketPort = process.env.SOCKET_PORT || 3101;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.listen(socketPort, () => {
  console.log(
    `Server with Socket.IO running on http://localhost:${socketPort}`,
  );
});
