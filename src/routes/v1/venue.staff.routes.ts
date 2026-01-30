import { VenueStaffController } from "controllers";
import express from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = express.Router();
const staffController = new VenueStaffController();
const auth = new AuthMiddlewares();

// Venue Staff routes
router.post(
  "/create-staff",
  auth.authorize(["VENUE", "VENUE_OWNER"]),
  staffController.addStaff,
);
router.get(
  "/list-staffs",
  auth.authorize(["VENUE", "VENUE_OWNER"]),
  staffController.listStaff,
);
router.put(
  "/update-staff/:staffId",
  auth.authorize(["VENUE", "VENUE_OWNER"]),
  staffController.updateStaff,
);
router.delete(
  "/delete-staff/:staffId",
  auth.authorize(["VENUE", "VENUE_OWNER"]),
  staffController.deleteStaff,
);

export default router;
