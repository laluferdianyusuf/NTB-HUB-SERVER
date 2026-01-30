import { VenueServiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueServiceController = new VenueServiceController();

router.post("/create", auth.authorize(["VENUE"]), (req, res) =>
  venueServiceController.createVenueService(req, res),
);

router.get(
  "/by-venue/:venueId",
  auth.authorize(["VENUE", "CUSTOMER", "ADMIN"]),
  (req, res) => venueServiceController.getServiceByVenue(req, res),
);

router.get(
  "/services-venue/:venueId",
  auth.authorize(["VENUE", "CUSTOMER", "ADMIN"]),
  (req, res) => venueServiceController.getAllServiceByVenue(req, res),
);

router.get("/detail/:id", auth.authorize(["VENUE", "CUSTOMER"]), (req, res) =>
  venueServiceController.getDetailService(req, res),
);

router.put("/update/:id", auth.authorize(["VENUE"]), (req, res) =>
  venueServiceController.updateVenueService(req, res),
);

router.delete("/deactivate/:id", auth.authorize(["VENUE"]), (req, res) =>
  venueServiceController.deactivateVenueService(req, res),
);

export default router;
