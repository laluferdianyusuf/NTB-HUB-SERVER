import { BookingType, UnitType } from "@prisma/client";
import {
  VenueSubCategoryRepository,
  VenueRepository,
  VenueServiceRepository,
} from "../repositories";
import { jsonToObject } from "helpers/parser";

type ServiceConfig = {
  sections?: {
    schedule?: boolean;
    units?: boolean;
    menu?: boolean;
  };

  durationStepMinutes?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;

  sessions?: Array<{
    id: string;
    label: string;
    start: string;
    end: string;
    price?: number;
    quota?: number;
  }>;
};

export function validateVenueServiceConfig(
  bookingType?: BookingType | null,
  unitType?: UnitType | null,
  config?: ServiceConfig
) {
  if (!config) return;

  const sections = config.sections ?? {};

  if (
    (bookingType === BookingType.TIME || bookingType === BookingType.SESSION) &&
    sections.schedule !== true
  ) {
    throw new Error(
      "Schedule section must be enabled for TIME or SESSION booking"
    );
  }

  if (unitType && sections.units !== true) {
    throw new Error("Units section must be enabled when unitType is defined");
  }

  if (
    sections.schedule !== true &&
    sections.units !== true &&
    sections.menu !== true
  ) {
    throw new Error("At least one section must be enabled");
  }

  if (bookingType === BookingType.TIME) {
    if (!config.durationStepMinutes || !config.minDurationMinutes) {
      throw new Error("TIME booking requires duration configuration");
    }
  }

  if (bookingType === BookingType.SESSION) {
    if (!Array.isArray(config.sessions) || config.sessions.length === 0) {
      throw new Error("SESSION booking requires sessions configuration");
    }
  }
}

export class VenueServiceService {
  private venueRepository = new VenueRepository();
  private venueSubCategoryRepository = new VenueSubCategoryRepository();
  private venueServiceRepository = new VenueServiceRepository();

  async create(input: {
    venueId: string;
    subCategoryId: string;
    bookingType?: BookingType;
    unitType?: UnitType;
    config?: Partial<ServiceConfig>;
  }) {
    const { venueId, subCategoryId } = input;

    const venue = await this.venueRepository.findVenueById(venueId);
    if (!venue) throw new Error("Venue not found");

    const subCategory = await this.venueSubCategoryRepository.findById(
      subCategoryId
    );
    if (!subCategory || !subCategory.isActive) {
      throw new Error("Venue sub category not active or not found");
    }

    const duplicate = await this.venueServiceRepository.findDuplicate(
      venueId,
      subCategoryId
    );
    if (duplicate) {
      throw new Error("Service already exists for this venue");
    }

    const defaultConfig = jsonToObject(
      subCategory.defaultConfig || {}
    ) as ServiceConfig;

    const mergedConfig: ServiceConfig = {
      ...defaultConfig,
      ...(input.config || {}),
    };

    const bookingType = input.bookingType ?? null;
    const unitType = input.unitType ?? null;

    validateVenueServiceConfig(bookingType, unitType, mergedConfig);

    return this.venueServiceRepository.create({
      venueId,
      subCategoryId,
      bookingType,
      unitType,
      config: mergedConfig,
    });
  }

  async update(
    id: string,
    input: {
      bookingType?: BookingType;
      unitType?: UnitType;
      config?: Partial<ServiceConfig>;
      isActive?: boolean;
    }
  ) {
    const service = await this.venueServiceRepository.findById(id);
    if (!service) throw new Error("Venue service not found");

    if (
      input.unitType &&
      service.units.length > 0 &&
      input.unitType !== service.unitType
    ) {
      throw new Error("Cannot change unit type when units already exist");
    }

    const currentConfig = jsonToObject(service.config) as ServiceConfig;

    const mergedConfig: ServiceConfig = input.config
      ? { ...currentConfig, ...input.config }
      : currentConfig;

    const finalBookingType = input.bookingType ?? service.bookingType;
    const finalUnitType = input.unitType ?? service.unitType;

    validateVenueServiceConfig(finalBookingType, finalUnitType, mergedConfig);

    return this.venueServiceRepository.update(id, {
      ...input,
      config: mergedConfig,
    });
  }

  async getByVenue(venueId: string) {
    return this.venueServiceRepository.findByVenue(venueId);
  }

  async getDetail(id: string) {
    const service = await this.venueServiceRepository.findById(id);
    if (!service) {
      throw new Error("Venue service not found");
    }
    return service;
  }

  async deactivate(id: string) {
    const service = await this.venueServiceRepository.findById(id);
    if (!service) {
      throw new Error("Venue service not found");
    }

    // Optional: prevent deactivate if active bookings exist
    // if (service.bookings.some(b => b.status === "PAID")) {}

    return this.venueServiceRepository.deactivate(id);
  }
}
