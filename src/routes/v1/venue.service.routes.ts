import { VenueServiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const venueServiceController = new VenueServiceController();

router.post(
  "/create",
  upload.single("image"),
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => venueServiceController.createVenueService(req, res),
);

router.get(
  "/by-venue/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER", "ADMIN"]),
  (req, res) => venueServiceController.getServiceByVenue(req, res),
);

router.get(
  "/services-venue/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER", "ADMIN"]),
  (req, res) => venueServiceController.getAllServiceByVenue(req, res),
);

router.get(
  "/detail/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "CUSTOMER"]),
  (req, res) => venueServiceController.getDetailService(req, res),
);

router.put(
  "/update/:id",
  upload.single("image"),
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueServiceController.updateVenueService(req, res),
);

router.delete(
  "/deactivate/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueServiceController.deactivateVenueService(req, res),
);

export default router;
