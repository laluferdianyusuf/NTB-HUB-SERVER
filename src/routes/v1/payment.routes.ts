import { PaymentController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const paymentController = new PaymentController();

router.post(
  "/topUp",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => paymentController.topUp(req, res),
);
router.post(
  "/topUpQris",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => paymentController.topUpQris(req, res),
);
router.post("/payment/callback", (req, res) =>
  paymentController.midtransCallback(req, res),
);

router.get(
  "/lists/:userId",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER", "ADMIN"]),
  (req, res) => paymentController.getPaymentsByUser(req, res),
);

export default router;
