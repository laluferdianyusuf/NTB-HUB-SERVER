import { OperationalRepository } from "repositories";

const operationalRepository = new OperationalRepository();

type OperationalHourInput = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  isOpen: boolean;
};

type EditHoursInput = {
  venueId: string;
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
};

type ToggleDayInput = {
  venueId: string;
  dayOfWeek: number;
  isOpen: boolean;
};

type CopyNextDayInput = {
  venueId: string;
  fromDay: number;
  toDay: number;
};

export class OperationalServices {
  async createOperationalHours(
    venueId: string,
    operationalHours: OperationalHourInput[] | string,
  ) {
    let opHours: OperationalHourInput[] = [];

    if (typeof operationalHours === "string") {
      try {
        opHours = JSON.parse(operationalHours);
      } catch {
        throw new Error("Invalid operationalHours JSON format");
      }
    } else {
      opHours = operationalHours;
    }

    if (!Array.isArray(opHours) || opHours.length === 0) {
      throw new Error("Operational hours required");
    }

    const existing = await operationalRepository.findAllByVenue(venueId);

    await Promise.all(
      opHours.map(async (item) => {
        const found = existing.find((x) => x.dayOfWeek === item.dayOfWeek);

        // close day
        if (!item.isOpen) {
          if (found) {
            await operationalRepository.delete(found.id);
          }
          return;
        }

        if (item.opensAt >= item.closesAt) {
          throw new Error(`Invalid time range day ${item.dayOfWeek}`);
        }

        if (found) {
          await operationalRepository.update(found.id, {
            opensAt: item.opensAt,
            closesAt: item.closesAt,
          });
        } else {
          await operationalRepository.create(venueId, {
            dayOfWeek: item.dayOfWeek,
            opensAt: item.opensAt,
            closesAt: item.closesAt,
          });
        }
      }),
    );

    return { message: "Schedule saved" };
  }

  async getOperationalHours(venueId: string) {
    return operationalRepository.findAllByVenue(venueId);
  }

  async editHours(data: EditHoursInput) {
    if (data.opensAt >= data.closesAt) {
      throw new Error("Open hour must be lower than close hour");
    }

    return operationalRepository.upsertByDay(
      data.venueId,
      data.dayOfWeek,
      data.opensAt,
      data.closesAt,
    );
  }

  async toggleDay(data: ToggleDayInput) {
    const found = await operationalRepository.findByVenueAndDay(
      data.venueId,
      data.dayOfWeek,
    );

    if (!data.isOpen) {
      if (found) {
        await operationalRepository.delete(found.id);
      }

      return { message: "Day closed" };
    }

    if (found) return found;

    return operationalRepository.create(data.venueId, {
      dayOfWeek: data.dayOfWeek,
      opensAt: 9,
      closesAt: 17,
    });
  }

  async copyNextDay(data: CopyNextDayInput) {
    const source = await operationalRepository.findByVenueAndDay(
      data.venueId,
      data.fromDay,
    );

    if (!source) {
      throw new Error("Schedule not set");
    }

    return operationalRepository.upsertByDay(
      data.venueId,
      data.toDay,
      source.opensAt,
      source.closesAt,
    );
  }

  async holidayClosure(venueId: string) {
    await operationalRepository.deleteByVenue(venueId);

    return { message: "Venue closed for holiday" };
  }

  async specialEventHours(venueId: string, opensAt: number, closesAt: number) {
    if (opensAt >= closesAt) {
      throw new Error("Invalid time range");
    }

    const all = await operationalRepository.findAllByVenue(venueId);

    await Promise.all(
      Array.from({ length: 7 }, async (_, day) => {
        const found = all.find((x) => x.dayOfWeek === day);

        if (found) {
          await operationalRepository.update(found.id, {
            opensAt,
            closesAt,
          });
        } else {
          await operationalRepository.create(venueId, {
            dayOfWeek: day,
            opensAt,
            closesAt,
          });
        }
      }),
    );

    return { message: "Special event hours applied" };
  }
}
