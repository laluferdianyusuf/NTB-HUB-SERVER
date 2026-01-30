import { VenueControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const venueController = new VenueControllers();

router.post(
  "/create-venue",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => venueController.createVenue(req, res),
);
router.get(
  "/venue/venues",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getVenues(req, res),
);
router.get(
  "/venue/liked-byUser/:userId",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getVenueLikedByUser(req, res),
);
router.get(
  "/venue/popular/venues",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getPopularVenues(req, res),
);

router.get(
  "/venue/by-category/:categoryId",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getVenuesByCategory(req, res),
);

router.get(
  "/venue/popular/by-category/:categoryId",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getPopularVenuesByCategory(req, res),
);

router.get(
  "/active/venues",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => venueController.getActiveVenues(req, res),
);
router.get("/venue/:id", (req, res) => venueController.getVenueById(req, res));
router.put(
  "/venue/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => venueController.updateVenue(req, res),
);

router.delete("/venue/delete/:id", (req, res) =>
  venueController.deleteVenue(req, res),
);

router.get(
  "/me",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueController.currentVenue(req, res),
);

router.get(
  "/venue/current/venue",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => venueController.currentVenue(req, res),
);

router.put(
  "/activate/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "ADMIN"]),
  (req, res) => venueController.activateVenue(req, res),
);

// interactions with venues
router.post(
  "/venue/:venueId/like",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => venueController.toggleLike(req, res),
);
router.post(
  "/venue/:venueId/impression",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => venueController.createImpression(req, res),
);

router.get(
  "/venue/:venueId/likes/count",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER", "VENUE_OWNER"]),
  (req, res) => venueController.getLikeCount(req, res),
);
router.get("/venue/:venueId/impressions/count", (req, res) =>
  venueController.getImpressionCount(req, res),
);

export default router;
