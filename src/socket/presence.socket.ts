import { PresenceService } from "services";

const service = new PresenceService();

export const registerPresenceSocket = (io: any, socket: any) => {
  const userId = socket.user.sub;

  socket.on(
    "presence:join",
    async ({ context, contextId }: { context: any; contextId: any }) => {
      const room = `${context}:${contextId}`;

      socket.join(room);

      await service.heartbeat(userId, context, contextId);

      const count = await service.countOnline(context, contextId);

      io.to(room).emit("presence:update", {
        context,
        contextId,
        count,
      });
    },
  );

  socket.on(
    "presence:leave",
    async ({ context, contextId }: { context: any; contextId: any }) => {
      const room = `${context}:${contextId}`;

      socket.leave(room);

      await service.markOffline(userId, context, contextId);

      const count = await service.countOnline(context, contextId);

      io.to(room).emit("presence:update", {
        context,
        contextId,
        count,
      });
    },
  );

  socket.on("disconnect", () => {
    // ❗ DO NOTHING
    // Redis TTL handles offline safely
  });
};
