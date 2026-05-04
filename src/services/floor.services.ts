import { Floor } from "@prisma/client";
import { FloorRepository } from "./../repositories/floor.repo";

const floorRepository = new FloorRepository();

export class FloorServices {
  async createFloor(data: Floor, venueId: string) {
    const createFloor = await floorRepository.createNewFloorByVenueId(
      data,
      venueId,
    );
    return { createFloor };
  }

  async getFloorsByVenueId(venueId: string) {
    const floors = await floorRepository.findFloorByVenueId(venueId);
    return floors;
  }

  async getFloorById(id: string) {
    const floor = await floorRepository.findFloorById(id);

    if (!floor) {
      throw new Error("Floor not found");
    }

    return floor;
  }

  async updateFloor(id: string, data: Floor) {
    const floor = await floorRepository.findFloorById(id);

    if (!floor) throw new Error("Floor not found");

    const updated = await floorRepository.updateFloor(id, data);

    return updated;
  }

  async deleteFloor(id: string) {
    const floor = await floorRepository.findFloorById(id);

    if (!floor) throw new Error("Floor not found");

    const deleted = await floorRepository.deleteFloor(id);

    return deleted;
  }
}
