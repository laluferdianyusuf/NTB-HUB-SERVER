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
router.get("/venue/venues", (req, res) => venueController.getVenues(req, res));
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
router.post("/venue/logout", auth.venueAuth.bind(auth), (req, res) =>
  auth.logoutVenue(req, res)
);
router.get("/venue/me", auth.venueAuth.bind(auth), (req, res) =>
  venueController.currentVenue(req, res)
);
router.get("/venue/current/venue", auth.venueAuth.bind(auth), (req, res) =>
  venueController.currentVenue(req, res)
);

export default router;
