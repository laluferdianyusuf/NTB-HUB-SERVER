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
        const location = await locationService.trackLocation(
          userId,
          latitude,
          longitude,
        );
        io.to(`user:${userId}`).emit("location:update", {
          userId,
          latitude,
          longitude,
          location,
        });
      } catch (error: any) {
        console.error("Realtime track error:", error.message);
        socket.emit("location:error", { message: "Failed to track location" });
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
