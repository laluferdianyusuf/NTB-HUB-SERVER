import { LocationController } from "controllers";
import { Router } from "express";

const router = Router();
const locationController = new LocationController();

router.post("/track", (req, res) => locationController.trackLocation(req, res));
router.get("/user/:userId", (req, res) =>
  locationController.getUserLocations(req, res),
);

export default router;
