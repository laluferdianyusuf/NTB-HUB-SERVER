import { LocationTracking } from "@prisma/client";
import { LocationRepository } from "../repositories/location.repo";

const locationRepository = new LocationRepository();

export class LocationServices {
  async trackLocation(data: LocationTracking) {
    try {
      const location = await locationRepository.createNewTracking(data);
      return {
        status: true,
        status_code: 201,
        message: "Location tracked successfully",
        data: location,
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        status_code: 500,
        message: "Failed to track location",
        data: null,
      };
    }
  }

  async getUserLocations(userId: string) {
    try {
      const locations = await locationRepository.findLocationTracking(userId);
      if (!locations) {
        return {
          status: false,
          status_code: 404,
          message: "User location not found",
          data: null,
        };
      }
      return {
        status: true,
        status_code: 200,
        message: "User locations retrieved",
        data: locations,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Failed to get user locations",
        data: null,
      };
    }
  }
}
