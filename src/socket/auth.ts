import jwt from "jsonwebtoken";

export const socketAuth = (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("INVALID_TOKEN"));
    }

    const payload = jwt.verify(token, process.env.ACCESS_SECRET as string);

    socket.user = payload; // { sub, name, ... }
    next();
  } catch (err: any) {
    console.log("SOCKET AUTH ERROR");
    console.log(err.name);
    console.log(err.message);

    next(new Error("INVALID_TOKEN"));
  }
};
