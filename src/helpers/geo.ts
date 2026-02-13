const EARTH_RADIUS = 6371000;

const toRad = (v: number) => (v * Math.PI) / 180;

export const calcDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const detectGpsSpoof = (lat?: number, lng?: number) => {
  if (!lat || !lng) return false;
  if (lat === 0 || lng === 0) return true;

  const decimals = (n: number) => (n.toString().split(".")[1] || "").length;

  if (decimals(lat) > 8 || decimals(lng) > 8) return true;

  return false;
};
