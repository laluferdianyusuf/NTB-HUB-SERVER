import { VenueControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const venueController = new VenueControllers();

router.post("/venue/sign", (req, res) =>
  venueController.signInWithInvitationKey(req, res)
);
router.post("/venue/refresh", (req, res) => venueController.refresh(req, res));
router.get("/venue/venues", auth.authorize(["ADMIN", "CUSTOMER"]), (req, res) =>
  venueController.getVenues(req, res)
);
router.get("/venue/:id", (req, res) => venueController.getVenueById(req, res));
router.put(
  "/venue/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => venueController.updateVenue(req, res)
);

router.delete("/venue/delete/:id", (req, res) =>
  venueController.deleteVenue(req, res)
);

router.post("/venue/logout", auth.authorize(["VENUE"]), (req, res) =>
  auth.logoutVenue(req, res)
);

router.get("/me", auth.authorize(["VENUE"]), (req, res) =>
  venueController.currentVenue(req, res)
);

router.get("/venue/current/venue", auth.authorize(["VENUE"]), (req, res) =>
  venueController.currentVenue(req, res)
);

router.put("/activate", auth.authorize(["VENUE", "ADMIN"]), (req, res) =>
  venueController.activateVenue(req, res)
);

// interactions with venues
router.post("/venue/:venueId/like", auth.authorize(["CUSTOMER"]), (req, res) =>
  venueController.toggleLike(req, res)
);
router.post(
  "/venue/:venueId/impression",
  auth.authorize(["CUSTOMER"]),
  (req, res) => venueController.createImpression(req, res)
);

router.get(
  "/venue/:venueId/likes/count",
  auth.authorize(["ADMIN", "CUSTOMER", "VENUE"]),
  (req, res) => venueController.getLikeCount(req, res)
);
router.get("/venue/:venueId/impressions/count", (req, res) =>
  venueController.getImpressionCount(req, res)
);

export default router;
