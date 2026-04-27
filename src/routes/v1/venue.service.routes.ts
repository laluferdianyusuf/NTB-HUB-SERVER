import { VenueServiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();

const auth = new AuthMiddlewares();
const venueServiceController = new VenueServiceController();

router.post("/create", auth.authenticate, upload.single("image"), (req, res) =>
  venueServiceController.createVenueService(req, res),
);

router.get("/by-venue/:venueId", auth.authenticate, (req, res) =>
  venueServiceController.getServiceByVenue(req, res),
);

router.get("/services-venue/:venueId", auth.authenticate, (req, res) =>
  venueServiceController.getAllServiceByVenue(req, res),
);

router.get("/summary/:venueId", auth.authenticate, (req, res) =>
  venueServiceController.getSummary(req, res),
);

router.get("/detail/:id", auth.authenticate, (req, res) =>
  venueServiceController.getDetailService(req, res),
);

router.put(
  "/update/:id",
  auth.authenticate,
  upload.single("image"),
  (req, res) => venueServiceController.updateVenueService(req, res),
);

router.patch("/toggle-status/:id", auth.authenticate, (req, res) =>
  venueServiceController.toggleStatus(req, res),
);

router.delete("/deactivate/:id", auth.authenticate, (req, res) =>
  venueServiceController.deactivateVenueService(req, res),
);

router.delete("/delete/:id", auth.authenticate, (req, res) =>
  venueServiceController.deleteVenueService(req, res),
);

export default router;
