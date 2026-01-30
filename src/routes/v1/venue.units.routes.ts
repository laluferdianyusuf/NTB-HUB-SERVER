import { VenueUnitControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueUnitController = new VenueUnitControllers();

router.post(
  "/create",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => venueUnitController.createVenueUnit(req, res),
);

router.get(
  "/by-service/:serviceId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER", "ADMIN"]),
  (req, res) => venueUnitController.getUnitByService(req, res),
);

router.get(
  "/by-venue/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER"]),
  (req, res) => venueUnitController.getUnitByVenue(req, res),
);

router.get(
  "/unit-availability/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER"]),
  (req, res) => venueUnitController.getAvailabilityUnits(req, res),
);

router.get(
  "/detail/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "ADMIN", "CUSTOMER"]),
  (req, res) => venueUnitController.getDetailUnit(req, res),
);

router.put(
  "/update/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueUnitController.updateVenueUnit(req, res),
);

router.delete(
  "/delete:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueUnitController.deactivateVenueUnit(req, res),
);

export default router;
