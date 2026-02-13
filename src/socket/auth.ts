import jwt from "jsonwebtoken";

export const socketAuth = (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("NO_TOKEN"));

    const payload = jwt.verify(token, process.env.ACCESS_SECRET as string);

    socket.user = payload; // { sub, name, ... }
    next();
  } catch (err: any) {
    next(new Error("INVALID_TOKEN"));
  }
};
