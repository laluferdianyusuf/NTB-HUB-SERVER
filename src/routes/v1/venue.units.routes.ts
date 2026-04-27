import { VenueUnitControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueUnitController = new VenueUnitControllers();

router.post("/create", auth.authenticate, (req, res) =>
  venueUnitController.createVenueUnit(req, res),
);

router.post("/bulk-create", auth.authenticate, (req, res) =>
  venueUnitController.bulkCreateVenueUnit(req, res),
);

router.get("/by-service/:serviceId", auth.authenticate, (req, res) =>
  venueUnitController.getUnitByService(req, res),
);

router.get("/by-venue/:venueId", auth.authenticate, (req, res) =>
  venueUnitController.getUnitByVenue(req, res),
);

router.get("/all/:venueId", auth.authenticate, (req, res) =>
  venueUnitController.getAllUnits(req, res),
);

router.get("/summary/:venueId", auth.authenticate, (req, res) =>
  venueUnitController.getSummary(req, res),
);

router.get("/availability/:venueId", auth.authenticate, (req, res) =>
  venueUnitController.getAvailabilityUnits(req, res),
);

router.get("/detail/:id", auth.authenticate, (req, res) =>
  venueUnitController.getDetailUnit(req, res),
);

router.put("/update/:id", auth.authenticate, (req, res) =>
  venueUnitController.updateVenueUnit(req, res),
);

router.patch("/toggle/:id", auth.authenticate, (req, res) =>
  venueUnitController.toggleStatus(req, res),
);

router.delete("/delete/:id", auth.authenticate, (req, res) =>
  venueUnitController.deactivateVenueUnit(req, res),
);

export default router;
