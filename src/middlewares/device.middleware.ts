import { hash } from "utils/hash";
import { Request, Response, NextFunction } from "express";

export const deviceBindingMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const deviceId = req.headers["x-device-id"];
  if (!deviceId) {
    return res.status(400).json({ message: "Device ID required" });
  }

  req._antiCheat = {
    ...req._antiCheat,
    deviceHash: hash(deviceId),
  };

  next();
};
