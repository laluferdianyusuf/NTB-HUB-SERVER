import { OrderControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const orderController = new OrderControllers();

router.post(
  "/create-order",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.createNewOrder(req, res),
);

router.post(
  "/cancel-order/:orderId",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.cancelOrder(req, res),
);

router.post(
  "/pay-order/:orderId",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.payOrder(req, res),
);

router.get("/users", auth.authenticate, (req, res) =>
  orderController.findAllUsersOrder(req, res),
);

export default router;
