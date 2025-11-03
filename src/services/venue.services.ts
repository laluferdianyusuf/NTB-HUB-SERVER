import { Venue } from "@prisma/client";
import {
  VenueRepository,
  InvitationKeyRepository,
  VenueBalanceRepository,
} from "./../repositories";
import { randomUUID } from "crypto";

const venueRepository = new VenueRepository();
const invitationRepository = new InvitationKeyRepository();
const venueBalanceRepository = new VenueBalanceRepository();

export class VenueServices {
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

      const updated = await venueRepository.updateVenue(id, {
        ...data,
        isActive: true,
      });

      const oldInvitation = await invitationRepository.findByVenueId(id);
      if (oldInvitation) {
        await invitationRepository.deleteByVenueId(id);
      }

      await venueBalanceRepository.generateInitialBalance(id);

      const key = `SIGN-${randomUUID()}`;
      const newKey = await invitationRepository.generate(id, null, key);
      return {
        status: true,
        status_code: 200,
        message: "Venue updated",
        data: { ...updated, newKey },
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
      await invitationRepository.deleteByVenueId(id);
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
