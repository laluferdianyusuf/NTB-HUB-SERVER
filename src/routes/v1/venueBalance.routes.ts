import { VenueBalanceController } from "controllers";
import { Router } from "express";
const router = Router();
const venueBalanceController = new VenueBalanceController();

router.get("/balance/venue/:venueId", (req, res) =>
  venueBalanceController.getVenueBalance(req, res)
);

export default router;
