import { LocationController } from "controllers";
import { Router } from "express";

const router = Router();
const locationController = new LocationController();

router.post("/user/location", (req, res) => locationController.track(req, res));
router.get("/user/:userId/location", (req, res) =>
  locationController.getLocations(req, res)
);

export default router;
