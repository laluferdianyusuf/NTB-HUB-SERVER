import { redisCache } from "config/redis.config";
import { Response, NextFunction } from "express";

export const riskScoreMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user.id;
  const key = `risk:${userId}`;

  const score = Number((await redisCache.get(key)) || 0);

  if (score > 10) {
    return res
      .status(429)
      .json({ message: "Aktivitas mencurigakan, coba lagi nanti" });
  }

  req.addRisk = async (value: number) => {
    await redisCache.incrby(key, value);
    await redisCache.expire(key, 3600);
  };

  next();
};
