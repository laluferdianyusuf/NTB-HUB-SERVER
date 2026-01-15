import { parseTimeToDateUTC } from "helpers/formatIsoDate";
import { OperationalRepository } from "repositories";

const operationalRepository = new OperationalRepository();

type OperationalHourInput = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
};

export class OperationalServices {
  async createOperationalHours(
    venueId: string,
    operationalHours: OperationalHourInput[] | string
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

    if (!Array.isArray(opHours) || opHours.length === 0) return;

    const existingOps = await operationalRepository.getOperationalHours(
      venueId
    );

    await Promise.all(
      opHours.map(async (op) => {
        const found = existingOps.find((x) => x.dayOfWeek === op.dayOfWeek);

        if (!op.isOpen) {
          if (found) {
            await operationalRepository.delete(found.id);
          }
          return;
        }

        const opensAt = parseTimeToDateUTC(op.opensAt);
        const closesAt = parseTimeToDateUTC(op.closesAt);

        if (opensAt >= closesAt) {
          throw new Error(`Invalid time range for day ${op.dayOfWeek}`);
        }

        if (found) {
          await operationalRepository.update(found.id, {
            opensAt,
            closesAt,
          });
        } else {
          await operationalRepository.create(venueId, {
            dayOfWeek: op.dayOfWeek,
            opensAt,
            closesAt,
          });
        }
      })
    );
  }

  async getOperationalHours(venueId: string) {
    try {
      const operationalHours = await operationalRepository.getOperationalHours(
        venueId
      );

      return {
        status: true,
        status_code: 200,
        message: "Operational hours retrieved successfully",
        data: operationalHours,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        error: String(error),
        data: null,
      };
    }
  }
}
