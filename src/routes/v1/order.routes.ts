import { OrderControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const orderController = new OrderControllers();

router.post(
  "/order/newOrder",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.createNewOrder(req, res),
);
router.put(
  "/order/update/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.updateOrder(req, res),
);
router.delete(
  "/order/delete/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.deleteOrder(req, res),
);
router.get(
  "/order/get/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.getOrderById(req, res),
);
router.get(
  "/order/orders",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.findAllOrders(req, res),
);
router.get(
  "/order/:bookingId/byBooking",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.findByBookingId(req, res),
);
router.put(
  "/order/:bookingId/payments",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => orderController.processOrderPayment(req, res),
);

export default router;
