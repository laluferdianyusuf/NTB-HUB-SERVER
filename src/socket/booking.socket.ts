export const registerBookingSocket = (io: any, socket: any) => {
  const userId = socket.user.sub;

  socket.join(`user:${userId}`);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
