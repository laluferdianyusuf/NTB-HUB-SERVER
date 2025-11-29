import { LocationController } from "controllers";
import { Router } from "express";

const router = Router();
const locationController = new LocationController();

router.post("/location/user", (req, res) => locationController.track(req, res));
router.get("/location/:userId", (req, res) =>
  locationController.getLocations(req, res)
);

export default router;
