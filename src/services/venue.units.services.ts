import { UnitType } from "@prisma/client";
import {
  FloorRepository,
  OperationalRepository,
  VenueRepository,
  VenueServiceRepository,
  VenueUnitRepository,
} from "../repositories";

type QueryUnits = {
  search?: string;
  serviceId?: string;
  isActive?: boolean;
  floorId?: string;
  page?: number;
  limit?: number;
};

export class VenueUnitService {
  private venueRepository = new VenueRepository();
  private venueServiceRepository = new VenueServiceRepository();
  private venueUnitRepository = new VenueUnitRepository();
  private operationalRepository = new OperationalRepository();
  private floorRepository = new FloorRepository();

  async create(input: {
    venueId: string;
    serviceId: string;
    name: string;
    price: number;
    type: UnitType;
    floorId?: string;
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
    if (!venue) throw new Error("Venue not found");

    const service = await this.venueServiceRepository.findById(serviceId);
    if (!service || !service.isActive) {
      throw new Error("Venue service not found or inactive");
    }

    if (service.venueId !== venueId) {
      throw new Error("Service does not belong to this venue");
    }

    if (service.unitType && service.unitType !== type) {
      throw new Error(`Unit type must be ${service.unitType}`);
    }

    if (floorId) {
      const floor = await this.floorRepository.findFloorById(floorId);
      if (!floor) throw new Error("Floor not found");
    }

    return this.venueUnitRepository.create({
      venueId,
      serviceId,
      floorId: floorId ?? null,
      name: name.trim(),
      price,
      type,
      isActive,
    });
  }

  async bulkCreate(input: {
    venueId: string;
    serviceId: string;
    type: UnitType;
    units: Array<{
      name: string;
      price: number;
      floorId?: string;
    }>;
  }) {
    const { venueId, serviceId, type, units } = input;

    if (!units?.length) {
      throw new Error("Units required");
    }

    const result = [];

    for (const item of units) {
      const unit = await this.create({
        venueId,
        serviceId,
        type,
        name: item.name,
        price: item.price,
        floorId: item.floorId,
      });

      result.push(unit);
    }

    return result;
  }

  async getByService(serviceId: string) {
    return this.venueUnitRepository.findByService(serviceId);
  }

  async getByVenue(venueId: string) {
    return this.venueUnitRepository.findByVenue(venueId);
  }

  async getAll(venueId: string, query?: QueryUnits) {
    const page = Number(query?.page || 1);
    const limit = Number(query?.limit || 20);
    const skip = (page - 1) * limit;

    return this.venueUnitRepository.findAll(venueId, {
      search: query?.search,
      serviceId: query?.serviceId,
      isActive: query?.isActive,
      floorId: query?.floorId,
      skip,
      take: limit,
    });
  }

  async getDetail(id: string) {
    const unit = await this.venueUnitRepository.findById(id);

    if (!unit) {
      throw new Error("Venue unit not found");
    }

    return unit;
  }

  async getSummary(venueId: string) {
    const data = await this.venueUnitRepository.findByVenue(venueId);

    return {
      total: data.length,
      active: data.filter((x) => x.isActive).length,
      inactive: data.filter((x) => !x.isActive).length,
      avgPrice:
        data.length > 0
          ? Math.floor(
              data.reduce((a, b) => a + Number(b.price), 0) / data.length,
            )
          : 0,
    };
  }

  async toggleStatus(id: string) {
    const unit = await this.venueUnitRepository.findById(id);

    if (!unit) {
      throw new Error("Venue unit not found");
    }

    return this.venueUnitRepository.update(id, {
      isActive: !unit.isActive,
    });
  }

  async getAvailabilityUnits(venueId: string, serviceId: string, date: string) {
    if (!date) throw new Error("Date required");

    const parts = date.trim().split("-");
    if (parts.length !== 3) {
      throw new Error("Invalid date format");
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const dayObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dayObj.getUTCDay();

    const operational = await this.operationalRepository.findByVenueAndDay(
      venueId,
      dayOfWeek,
    );

    if (!operational) {
      throw new Error("Venue closed");
    }

    const hours: number[] = [];

    for (let h = operational.opensAt; h < operational.closesAt; h++) {
      hours.push(h);
    }

    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const units = await this.venueUnitRepository.getUnitsWithBookings(
      venueId,
      serviceId,
      dayStart,
      dayEnd,
    );

    return units.map((u) => {
      const slots = hours.map((hour) => {
        const slotStart = new Date(Date.UTC(year, month - 1, day, hour));
        const slotEnd = new Date(Date.UTC(year, month - 1, day, hour + 1));

        const booked = u.booking.some(
          (b) => slotStart < b.endTime && slotEnd > b.startTime,
        );

        return {
          hour,
          available: !booked,
        };
      });

      return {
        id: u.id,
        name: u.name,
        price: u.price,
        slots,
      };
    });
  }

  async update(
    id: string,
    input: {
      name?: string;
      price?: number;
      type?: UnitType;
      floorId?: string;
      isActive?: boolean;
    },
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
      throw new Error("Price must be greater than 0");
    }

    return this.venueUnitRepository.update(id, {
      ...input,
      name: input.name?.trim(),
    });
  }

  async deactivate(id: string) {
    const unit = await this.venueUnitRepository.findById(id);

    if (!unit) {
      throw new Error("Venue unit not found");
    }

    return this.venueUnitRepository.deactivate(id);
  }
}
