import { VenueBalanceServices } from "services";

export class VenueBalanceController {
  private venueBalanceServices: VenueBalanceServices;

  constructor() {
    this.venueBalanceServices = new VenueBalanceServices();
  }

  async getVenueBalance(req: any, res: any) {
    const venueId = req.params.venueId;
    const result = await this.venueBalanceServices.getVenueBalance(venueId);
    res.status(result.status_code).json(result);
  }
}
