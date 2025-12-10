import { OperationalRepository } from "repositories";
const operationalRepository = new OperationalRepository();

export class OperationalServices {
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
        message: "Internal server error" + error,
        data: null,
      };
    }
  }
}
