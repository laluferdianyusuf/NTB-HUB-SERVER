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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => venueController.createVenue(req, res),
);
router.get("/venue/venues", auth.authenticate, (req, res) =>
  venueController.getVenues(req, res),
);
router.get("/venue/liked-byUser/:userId", auth.authenticate, (req, res) =>
  venueController.getVenueLikedByUser(req, res),
);

router.get("/venue/popular/venues", auth.authenticate, (req, res) =>
  venueController.getPopularVenues(req, res),
);

router.get("/active/venues", auth.authenticate, (req, res) =>
  venueController.getActiveVenues(req, res),
);
router.get("/venue/:id", auth.authenticate, (req, res) =>
  venueController.getVenueDetail(req, res),
);
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

router.put("/activate/:id", auth.authenticate, (req, res) =>
  venueController.activateVenue(req, res),
);

// interactions with venues
router.post("/venue/:venueId/like", auth.authenticate, (req, res) =>
  venueController.toggleLike(req, res),
);
router.post("/venue/:venueId/impression", auth.authenticate, (req, res) =>
  venueController.createImpression(req, res),
);

router.get("/venue/:venueId/likes/count", auth.authenticate, (req, res) =>
  venueController.getLikeCount(req, res),
);
router.get("/venue/:venueId/impressions/count", (req, res) =>
  venueController.getImpressionCount(req, res),
);

export default router;
