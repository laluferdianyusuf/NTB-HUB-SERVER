import { redisCache } from "config/redis.config";
import { getDistanceMeter } from "helpers/geo";
import { Request, Response, NextFunction } from "express";

export const speedCheckMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user.id;
  const { latitude, longitude } = req.body;

  const key = `lastloc:${userId}`;
  const last = await redisCache.hgetall(key);

  if (last.lat && last.lng && last.time) {
    const distance = getDistanceMeter(
      Number(last.lat),
      Number(last.lng),
      latitude,
      longitude,
    );

    const timeDiff = (Date.now() - Number(last.time)) / 1000;
    const speedKmh = (distance / timeDiff) * 3.6;

    if (speedKmh > 150) {
      return res.status(403).json({ message: "Pergerakan tidak wajar" });
    }
  }

  await redisCache.hset(key, {
    lat: latitude,
    lng: longitude,
    time: Date.now(),
  });

  next();
};
