import { WithdrawController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const controller = new WithdrawController();

/* VENUE */
router.post("/request", auth.venueAuth, controller.request);
router.get("/my", auth.venueAuth, controller.venueWithdraws);

/* ADMIN */
router.get("/admin", auth.authenticate, auth.isAdmin, controller.allWithdraws);
router.patch(
  "/admin/:id/approve",
  auth.authenticate,
  auth.isAdmin,
  controller.approve
);
router.patch(
  "/admin/:id/reject",
  auth.authenticate,
  auth.isAdmin,
  controller.reject
);
router.patch(
  "/admin/:id/paid",
  auth.authenticate,
  auth.isAdmin,
  controller.markAsPaid
);

export default router;
