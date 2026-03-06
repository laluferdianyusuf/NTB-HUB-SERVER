import { VenueBalanceRepository } from "repositories";
const venueBalanceRepository = new VenueBalanceRepository();

export class VenueBalanceServices {
  async getVenueBalance(venueId: string) {
    const balance = await venueBalanceRepository.getBalanceByUserId(venueId);

    return {
      balance,
    };
  }
}
