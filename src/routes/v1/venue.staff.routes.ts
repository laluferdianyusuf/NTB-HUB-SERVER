import { VenueStaffController } from "controllers";
import express from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = express.Router();
const staffController = new VenueStaffController();
const auth = new AuthMiddlewares();

// Venue Staff routes
router.post(
  "/create-staff/:venueId",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => staffController.addStaff(req, res),
);
router.get(
  "/list-staffs",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => staffController.listStaff(req, res),
);
router.put(
  "/update-staff/:staffId",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => staffController.updateStaff(req, res),
);
router.delete(
  "/delete-staff/:staffId",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => staffController.deleteStaff(req, res),
);

export default router;
