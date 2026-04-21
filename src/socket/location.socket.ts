import { LocationService } from "services";

const locationService = new LocationService();

export const registerLocationSocket = (io: any, socket: any) => {
  const userId = socket.user.sub;

  socket.join(`user:${userId}`);

  socket.on(
    "location:tracking",
    async ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => {
      if (
        latitude == null ||
        longitude == null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return socket.emit("location:error", {
          message: "Invalid coordinates",
        });
      }

      try {
        await locationService.trackLocation(userId, latitude, longitude);

        const nearbyUsers = await locationService.getNearbyUsers(userId, 2000);

        socket.emit("nearby:users", nearbyUsers);

        nearbyUsers.forEach((user: any) => {
          io.to(`user:${user.userId}`).emit("user:moved", {
            userId,
            latitude,
            longitude,
          });

          io.to(`user:${user.userId}`).emit("nearby:users", nearbyUsers);
        });
      } catch (error: any) {
        console.error("Realtime track error:", error.message);

        socket.emit("location:error", {
          message: "Failed to track location",
        });
      }
    },
  );

  socket.on("disconnect", async () => {
    try {
      await locationService.removeUser(userId);

      io.emit("user:offline", userId);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  });
};
