import { redis } from "config/redis.config";

export async function updateCourierLocation(
  courierId: string,
  lat: number,
  lng: number,
) {
  await redis.geoadd("couriers:geo", lng, lat, courierId);

  await redis.sadd("couriers:online", courierId);

  await redis.set(`courier:${courierId}:alive`, "1", "EX", 30);
}

export async function findNearestCouriers(
  lat: number,
  lng: number,
  radiusKm = 5,
  limit = 10,
) {
  const result = await redis.geosearch(
    "couriers:geo",
    "FROMLONLAT",
    lng,
    lat,
    "BYRADIUS",
    radiusKm,
    "km",
    "ASC",
    "COUNT",
    limit,
  );

  return result; // array of courierId
}

export async function filterAvailableCouriers(courierIds: string[]) {
  if (!courierIds.length) return [];

  const pipeline = redis.pipeline();

  courierIds.forEach((id) => {
    pipeline.sismember("couriers:online", id);
    pipeline.get(`courier:${id}:alive`);
  });

  const results = await pipeline.exec();

  const available: string[] = [];

  for (let i = 0; i < courierIds.length; i++) {
    const isOnline = results && results[i * 2][1];
    const isAlive = results && results[i * 2 + 1][1];

    if (isOnline && isAlive) {
      available.push(courierIds[i]);
    }
  }

  return available;
}
