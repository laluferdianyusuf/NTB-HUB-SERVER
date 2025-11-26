import { BookingControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const bookingController = new BookingControllers();

router.post("/booking", auth.authenticate.bind(auth), (req, res) =>
  bookingController.createBooking(req, res)
);
router.put("/payment/:id", auth.authenticate.bind(auth), (req, res) =>
  bookingController.processBookingPayment(req, res)
);
router.get("/bookings", auth.authenticate.bind(auth), (req, res) =>
  bookingController.getAllBookings(req, res)
);
router.get("/booking/users/:userId", auth.authenticate.bind(auth), (req, res) =>
  bookingController.getBookingByUserId(req, res)
);
router.get("/booking/:id", (req, res) =>
  bookingController.getBookingById(req, res)
);
router.put("/booking/:id/cancel", auth.authenticate.bind(auth), (req, res) =>
  bookingController.cancelBooking(req, res)
);
router.put("/booking/:id/complete", auth.authenticate.bind(auth), (req, res) =>
  bookingController.completeBooking(req, res)
);

export default router;
