import { Owner } from "@prisma/client";
import { OwnerRepository } from "repositories";
import { uploadToCloudinary } from "utils/image";
const ownerRepository = new OwnerRepository();

export class OwnerServices {
  async createOwner(data: Owner, file?: Express.Multer.File) {
    try {
      let imageUrl = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "owners");
      }
      const owner = await ownerRepository.findOwnerById(data.id);

      if (owner) {
        return {
          status: false,
          status_code: 400,
          message: "Owner has been registered",
          data: null,
        };
      }
      const createdOwner = await ownerRepository.createOwner({
        ...data,
        image: imageUrl,
      });
      return {
        status: true,
        status_code: 200,
        message: "Owner retrieved successful",
        data: createdOwner,
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
