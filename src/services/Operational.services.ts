import { OperationalRepository } from "repositories";

const operationalRepository = new OperationalRepository();

type OperationalHourInput = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  isOpen: boolean;
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

    if (!Array.isArray(opHours) || opHours.length === 0) return;

    const existingOps =
      await operationalRepository.getOperationalHours(venueId);

    await Promise.all(
      opHours.map(async (op) => {
        const found = existingOps.find((x) => x.dayOfWeek === op.dayOfWeek);

        if (!op.isOpen) {
          if (found) {
            await operationalRepository.delete(found.id);
          }
          return;
        }

        if (op.opensAt >= op.closesAt) {
          throw new Error(`Invalid time range for day ${op.dayOfWeek}`);
        }

        if (found) {
          await operationalRepository.update(found.id, {
            opensAt: op.opensAt,
            closesAt: op.closesAt,
          });
        } else {
          await operationalRepository.create(venueId, {
            dayOfWeek: op.dayOfWeek,
            opensAt: op.opensAt,
            closesAt: op.closesAt,
          });
        }
      }),
    );
  }

  async getOperationalHours(venueId: string) {
    const operationalHours =
      await operationalRepository.getOperationalHours(venueId);

    return operationalHours;
  }
}
