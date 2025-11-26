import { VenueBalanceController } from "controllers";
import { Router } from "express";
const router = Router();
const venueBalanceController = new VenueBalanceController();

router.get("/venue/:venueId/balance", (req, res) =>
  venueBalanceController.getVenueBalance(req, res)
);

export default router;
