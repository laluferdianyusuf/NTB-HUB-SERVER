import { WithdrawController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const controller = new WithdrawController();

/* VENUE */
router.post(
  "/request",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  controller.request,
);
router.get(
  "/my/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  controller.venueWithdraws,
);

/* ADMIN */
router.get(
  "/admin",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  controller.allWithdraws,
);
router.patch(
  "/admin/:id/approve",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  controller.approve,
);
router.patch(
  "/admin/:id/reject",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  controller.reject,
);
router.patch(
  "/admin/:id/paid",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  controller.markAsPaid,
);

export default router;
