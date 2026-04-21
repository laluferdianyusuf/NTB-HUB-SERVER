import { redis } from "config/redis.config";
import { UserRepository } from "repositories";

const LOCATION_KEY = "locations:users";
const userRepository = new UserRepository();

export class LocationService {
  async trackLocation(userId: string, latitude: number, longitude: number) {
    await redis.geoadd(LOCATION_KEY, longitude, latitude, userId);

    await redis.set(`location:${userId}`, "1", "EX", 60);

    return { userId, latitude, longitude };
  }

  async getNearbyUsers(userId: string, radius = 2000) {
    const pos = await redis.geopos(LOCATION_KEY, userId);

    if (!pos || !pos[0]) return [];

    const [lng, lat] = pos[0];

    const results = await redis.georadius(
      LOCATION_KEY,
      lng,
      lat,
      radius,
      "m",
      "WITHDIST",
      "WITHCOORD",
    );

    const users = await Promise.all(
      results
        .map((item: any) => ({
          userId: String(item[0]),
          distance: parseFloat(item[1]),
          longitude: Number(item[2][0]),
          latitude: Number(item[2][1]),
        }))
        .filter((u) => String(u.userId) !== String(userId))
        .map(async (loc) => {
          try {
            const cached = await redis.get(`user:${loc.userId}`);

            if (cached) {
              const user = JSON.parse(cached);

              return {
                ...loc,
                username: user.username,
                avatar: user.avatar,
              };
            }

            const user = await userRepository.findById(loc.userId);

            if (user) {
              const userData = {
                username: user.username,
                avatar: user.photo,
              };

              await redis.set(
                `user:${loc.userId}`,
                JSON.stringify(userData),
                "EX",
                3600,
              );

              return {
                ...loc,
                ...userData,
              };
            }

            return loc;
          } catch {
            return loc;
          }
        }),
    );

    return users
      .filter(Boolean)
      .sort((a: any, b: any) => a.distance - b.distance);
  }

  async removeUser(userId: string) {
    await redis.zrem(LOCATION_KEY, userId);
    await redis.del(`location:${userId}`);
  }
}
