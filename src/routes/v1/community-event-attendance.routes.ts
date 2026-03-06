import { CommunityEventAttendanceControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const attendanceController = new CommunityEventAttendanceControllers();
const auth = new AuthMiddlewares();

router.post("/events/:eventId/check-in", auth.authenticate, (req, res) =>
  attendanceController.checkIn(req, res),
);

export default router;
