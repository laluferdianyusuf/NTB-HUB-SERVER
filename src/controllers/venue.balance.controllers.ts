import { sendError, sendSuccess } from "helpers/response";
import { VenueBalanceServices } from "services";

export class VenueBalanceController {
  private venueBalanceServices: VenueBalanceServices;

  constructor() {
    this.venueBalanceServices = new VenueBalanceServices();
  }

  async getVenueBalance(req: any, res: any) {
    try {
      const venueId = req.params.venueId;
      const result = await this.venueBalanceServices.getVenueBalance(venueId);
      sendSuccess(res, result, "Balance retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
