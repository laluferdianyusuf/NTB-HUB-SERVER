import { getDistance } from "geolib";
import { LocationRepository } from "../repositories/location.repo";

const locationRepository = new LocationRepository();

export class LocationService {
  private lastSaved: Map<string, { latitude: number; longitude: number }> =
    new Map();

  async trackLocation(userId: string, latitude: number, longitude: number) {
    const last = this.lastSaved.get(userId);

    if (last) {
      const distance = getDistance(
        { latitude: last.latitude, longitude: last.longitude },
        { latitude, longitude },
      );
      if (distance < 10) {
        return null;
      }
    }

    const location = await locationRepository.save(userId, latitude, longitude);
    this.lastSaved.set(userId, { latitude, longitude });

    return location;
  }

  async getUserLocations(userId: string) {
    if (!userId) {
      throw new Error("Missing userId");
    }

    const locations = await locationRepository.getLast(userId);

    if (!locations || locations.length === 0) {
      throw new Error("No locations found for user");
    }

    return locations;
  }
}
