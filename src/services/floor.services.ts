import { Floor } from "@prisma/client";
import { FloorRepository } from "./../repositories/floor.repo";

const floorRepository = new FloorRepository();

export class FloorServices {
  async createFloor(data: Floor, venueId: string) {
    try {
      const createFloor = await floorRepository.createNewFloorByVenueId(
        data,
        venueId
      );
      return {
        status: true,
        status_code: 201,
        message: "Floor created successfully",
        data: createFloor,
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

  async getFloorsByVenueId(venueId: string) {
    try {
      const venues = await floorRepository.findFloorByVenueId(venueId);
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

  async getFloorById(id: string) {
    try {
      const floor = await floorRepository.findFloorById(id);

      if (!floor) {
        return {
          status: false,
          status_code: 404,
          message: "Floor not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Floor founded",
        data: floor,
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

  async updateFloor(id: string, data: Floor) {
    try {
      const floor = await floorRepository.findFloorById(id);

      if (!floor) {
        return {
          status: false,
          status_code: 404,
          message: "Floor not found",
          data: null,
        };
      }

      const updated = await floorRepository.updateFloor(id, data);

      return {
        status: true,
        status_code: 200,
        message: "Floor updated",
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

  async deleteFloor(id: string) {
    try {
      const floor = await floorRepository.findFloorById(id);

      if (!floor) {
        return {
          status: false,
          status_code: 404,
          message: "Floor not found",
          data: null,
        };
      }

      const deleted = await floorRepository.deleteFloor(id);

      return {
        status: true,
        status_code: 200,
        message: "floor deleted",
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
