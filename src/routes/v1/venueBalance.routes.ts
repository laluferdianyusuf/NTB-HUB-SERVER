import { VenueBalanceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
const router = Router();
const venueBalanceController = new VenueBalanceController();
const auth = new AuthMiddlewares();

router.get("/balance/venue/:venueId", auth.venueAuth.bind(auth), (req, res) =>
  venueBalanceController.getVenueBalance(req, res)
);

export default router;
