import { WithdrawController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const controller = new WithdrawController();

/* VENUE */
router.post("/request", auth.authorize(["VENUE"]), controller.request);
router.get("/my", auth.authorize(["VENUE"]), controller.venueWithdraws);

/* ADMIN */
router.get("/admin", auth.authorize(["ADMIN"]), controller.allWithdraws);
router.patch(
  "/admin/:id/approve",
  auth.authorize(["ADMIN"]),
  controller.approve
);
router.patch("/admin/:id/reject", auth.authorize(["ADMIN"]), controller.reject);
router.patch(
  "/admin/:id/paid",
  auth.authorize(["ADMIN"]),
  controller.markAsPaid
);

export default router;
