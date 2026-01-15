import { UnitType } from "@prisma/client";
import {
  VenueRepository,
  VenueServiceRepository,
  VenueUnitRepository,
  FloorRepository,
} from "../repositories";

export class VenueUnitService {
  private venueRepository = new VenueRepository();
  private venueServiceRepository = new VenueServiceRepository();
  private venueUnitRepository = new VenueUnitRepository();
  private floorRepository = new FloorRepository();

  // CREATE UNIT
  // Dipanggil saat:
  // - Owner melengkapi venue
  // - Setelah VenueService dibuat
  async create(input: {
    venueId: string;
    serviceId: string;
    floorId?: string;
    name: string;
    price: number;
    type: UnitType;
    isActive?: boolean;
  }) {
    const {
      venueId,
      serviceId,
      floorId,
      name,
      price,
      type,
      isActive = true,
    } = input;

    const venue = await this.venueRepository.findVenueById(venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    const service = await this.venueServiceRepository.findById(serviceId);
    if (!service || !service.isActive) {
      throw new Error("Venue service not found or inactive");
    }

    if (service.venueId !== venueId) {
      throw new Error("Service does not belong to this venue");
    }

    if (service.unitType && service.unitType !== type) {
      throw new Error(`Unit type must be ${service.unitType} for this service`);
    }

    if (price <= 0) {
      throw new Error("Unit price must be greater than 0");
    }

    return this.venueUnitRepository.create({
      venueId,
      serviceId,
      floorId,
      name: name.trim(),
      price,
      type,
      isActive,
    });
  }

  async getByService(serviceId: string) {
    return this.venueUnitRepository.findByService(serviceId);
  }

  async getByVenue(venueId: string) {
    return this.venueUnitRepository.findByVenue(venueId);
  }

  async getDetail(id: string) {
    const unit = await this.venueUnitRepository.findById(id);
    if (!unit) {
      throw new Error("Venue unit not found");
    }
    return unit;
  }

  // UPDATE UNIT
  // Tidak boleh mengubah type jika sudah ada booking

  async update(
    id: string,
    input: {
      name?: string;
      price?: number;
      type?: UnitType;
      isActive?: boolean;
    }
  ) {
    const unit = await this.venueUnitRepository.findById(id);
    if (!unit) {
      throw new Error("Venue unit not found");
    }

    if (input.type && unit.service.unitType) {
      if (input.type !== unit.service.unitType) {
        throw new Error(`Unit type must remain ${unit.service.unitType}`);
      }
    }

    if (input.price !== undefined && input.price <= 0) {
      throw new Error("Unit price must be greater than 0");
    }

    return this.venueUnitRepository.update(id, {
      ...input,
      name: input.name?.trim(),
    });
  }

  // SOFT DELETE
  // Aman untuk data booking
  async deactivate(id: string) {
    const unit = await this.venueUnitRepository.findById(id);
    if (!unit) {
      throw new Error("Venue unit not found");
    }

    // Optional future guard:
    // if (unit.booking.length > 0) {}

    return this.venueUnitRepository.deactivate(id);
  }
}
