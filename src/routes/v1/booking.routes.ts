import { BookingControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const bookingController = new BookingControllers();

router.post("/booking/create", auth.authorize(["CUSTOMER"]), (req, res) =>
  bookingController.createBooking(req, res),
);
router.put("/booking/payment/:id", auth.authorize(["CUSTOMER"]), (req, res) =>
  bookingController.processBookingPayment(req, res),
);
router.get(
  "/booking/bookings",
  auth.authorize(["CUSTOMER", "ADMIN"]),
  (req, res) => bookingController.getAllBookings(req, res),
);
router.get(
  "/booking/users/:userId",
  auth.authorize(["CUSTOMER", "ADMIN"]),
  (req, res) => bookingController.getBookingByUserId(req, res),
);

router.get(
  "/booking/by-venue/:venueId",
  auth.authorize(["VENUE", "ADMIN"]),
  (req, res) => bookingController.getBookingByVenueId(req, res),
);

router.get(
  "/booking/status-paid/:userId",
  auth.authorize(["CUSTOMER"]),
  (req, res) => bookingController.getBookingPaidByUserId(req, res),
);

router.get(
  "/booking/status-pending/:userId",
  auth.authorize(["CUSTOMER"]),
  (req, res) => bookingController.getBookingPendingByUserId(req, res),
);

router.get("/booking/:id", (req, res) =>
  bookingController.getBookingById(req, res),
);
router.put("/booking/:id/cancel", auth.authorize(["CUSTOMER"]), (req, res) =>
  bookingController.cancelBooking(req, res),
);
router.put("/booking/:id/complete", auth.authorize(["CUSTOMER"]), (req, res) =>
  bookingController.completeBooking(req, res),
);
router.get("/existing/bookings", (req, res) =>
  bookingController.getExistingBooking(req, res),
);

export default router;
