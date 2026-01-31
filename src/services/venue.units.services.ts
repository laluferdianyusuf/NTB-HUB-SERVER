import { UnitType } from "@prisma/client";
import {
  VenueRepository,
  VenueServiceRepository,
  VenueUnitRepository,
  FloorRepository,
  OperationalRepository,
} from "../repositories";

export class VenueUnitService {
  private venueRepository = new VenueRepository();
  private venueServiceRepository = new VenueServiceRepository();
  private venueUnitRepository = new VenueUnitRepository();
  private operationalRepository = new OperationalRepository();
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

  async getAvailabilityUnits(
    venueId: string,
    serviceId: string,
    date: string, // format: "YYYY-MM-DD"
  ) {
    // trim dan cek kosong
    if (!date || typeof date !== "string") {
      throw new Error("Date is required");
    }

    // Split dan parse angka
    const parts = date.trim().split("-");
    if (parts.length !== 3) {
      throw new Error("Invalid date format");
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      year < 1000 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new Error("Invalid date numbers");
    }

    // Buat objek tanggal UTC
    const dayObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dayObj.getUTCDay();
    console.log("dayOfWeek", dayOfWeek);

    // Ambil jam operasional
    const operational =
      await this.operationalRepository.getOperationalHourOfWeek(
        venueId,
        dayOfWeek,
      );

    if (!operational) {
      throw new Error("Venue closed");
    }

    const { opensAt, closesAt } = operational;

    const hours: number[] = [];
    for (let h = opensAt; h < closesAt; h++) {
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
        const slotStart = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
        const slotEnd = new Date(
          Date.UTC(year, month - 1, day, hour + 1, 0, 0),
        );

        const isBooked = u.booking.some(
          (b) => slotStart < b.endTime && slotEnd > b.startTime,
        );

        return {
          hour,
          available: !isBooked,
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

  // UPDATE UNIT
  // Tidak boleh mengubah type jika sudah ada booking
  async update(
    id: string,
    input: {
      name?: string;
      price?: number;
      type?: UnitType;
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
