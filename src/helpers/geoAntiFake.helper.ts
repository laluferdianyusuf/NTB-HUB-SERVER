import { calcDistanceMeters } from "./geo";

const MAX_HUMAN_SPEED_MPS = 55;

export const detectTeleport = (
  lastLat: number,
  lastLng: number,
  lastTime: Date,
  currentLat: number,
  currentLng: number,
  currentTime: Date,
) => {
  const distance = calcDistanceMeters(lastLat, lastLng, currentLat, currentLng);

  const timeDiff = (currentTime.getTime() - lastTime.getTime()) / 1000;

  if (timeDiff <= 0) return true;

  const speed = distance / timeDiff;

  return speed > MAX_HUMAN_SPEED_MPS;
};
