import { VenueUnitControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueUnitController = new VenueUnitControllers();

router.post("/create", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.createVenueUnit(req, res)
);

router.get("/by-service/:serviceId", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.getUnitByService(req, res)
);

router.get("/by-venue/:venueId", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.getUnitByVenue(req, res)
);

router.get("/detail/:id", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.getDetailUnit(req, res)
);

router.put("/update/:id", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.updateVenueUnit(req, res)
);

router.delete("/delete:id", auth.authorize(["VENUE"]), (req, res) =>
  venueUnitController.deactivateVenueUnit(req, res)
);

export default router;
