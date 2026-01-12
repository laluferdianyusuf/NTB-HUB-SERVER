import { Router } from "express";
import { EventOrderController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new EventOrderController();
const auth = new AuthMiddlewares();

router.post("/checkout", auth.authorize(["CUSTOMER"]), controller.checkout);

router.post("/payment/webhook", controller.paymentWebhook);

router.get("/:id", auth.authorize(["CUSTOMER"]), controller.getDetail);

export default router;
