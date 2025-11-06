import { Owner } from "@prisma/client";
import { OwnerRepository } from "repositories";
const ownerRepository = new OwnerRepository();

export class OwnerServices {
  async createOwner(data: Owner) {
    try {
      const owner = await ownerRepository.findOwnerById(data.id);

      if (owner) {
        return {
          status: false,
          status_code: 400,
          message: "Owner has been registered",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Owner retrieved successful",
        data: owner,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }

  async findOwnerByVenue(venueId: string) {
    try {
      const owner = await ownerRepository.findOwnerByVenue(venueId);

      if (!owner) {
        return {
          status: false,
          status_code: 404,
          message: "Owner hasn't registered to this venue",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Owner retrieved successful",
        data: owner,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
}
