import { Venue } from "@prisma/client";
import { VenueRepository } from "./../repositories/venue.repo";

const venueRepository = new VenueRepository();

export class VenueServices {
  async createVenue(data: Venue) {
    try {
      const createdVenue = await venueRepository.createVenue(data);
      return {
        status: true,
        status_code: 201,
        message: "Venue created successfully",
        data: createdVenue,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getVenues() {
    try {
      const venues = await venueRepository.findAllVenue();
      return {
        status: true,
        status_code: 200,
        message: "Venues retrieved",
        data: venues,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getVenueById(id: string) {
    try {
      const existing = await venueRepository.findVenueById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Venue founded",
        data: existing,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async updateVenue(id: string, data: Venue) {
    try {
      const existing = await venueRepository.findVenueById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      const updated = await venueRepository.updateVenue(id, data);

      return {
        status: true,
        status_code: 200,
        message: "Venue updated",
        data: updated,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async deleteVenue(id: string) {
    try {
      const existing = await venueRepository.findVenueById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Venue not found",
          data: null,
        };
      }

      const deleted = await venueRepository.deleteVenue(id);

      return {
        status: true,
        status_code: 200,
        message: "Venue deleted",
        data: deleted,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }
}
