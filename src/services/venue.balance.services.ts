import { VenueBalanceRepository } from "repositories";
const venueBalanceRepository = new VenueBalanceRepository();

export class VenueBalanceServices {
  async getVenueBalance(venueId: string) {
    try {
      const balance = await venueBalanceRepository.getBalanceByUserId(venueId);

      return {
        status: true,
        status_code: 200,
        message: "Venue balance retrieved successfully",
        data: balance,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
}
