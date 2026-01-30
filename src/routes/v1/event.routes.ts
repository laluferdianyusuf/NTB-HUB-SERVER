import { Router } from "express";
import {
  EventController,
  EventOrderController,
  EventTicketController,
  EventTicketTypeController,
} from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const eventController = new EventController();
const eventTicketController = new EventTicketController();
const eventTicketTypeController = new EventTicketTypeController();
const eventOrderController = new EventOrderController();
const auth = new AuthMiddlewares();

// PUBLIC
router.get("/list-events", (req, res) => eventController.listEvent(req, res));
router.get("/detail-event/:id", (req, res) =>
  eventController.detailEvent(req, res),
);

// ADMIN
router.post(
  "/create-event",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  upload.single("image"),
  (req, res) => eventController.create(req, res),
);

router.put(
  "/update/:id/status",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  (req, res) => eventController.updateStatusEvent(req, res),
);

router.delete(
  "/remove/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  (req, res) => eventController.removeEvent(req, res),
);

// event scan ticket
router.post(
  "/scan-ticket",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "EVENT_OWNER", "ADMIN"]),
  (req, res) => eventTicketController.scan(req, res),
);

// event verify ticket
router.post(
  "/verify-ticket",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "EVENT_OWNER", "ADMIN"]),
  (req, res) => eventTicketController.verify(req, res),
);

// event ticket DETAIL
router.get(
  "/detail-ticket/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "EVENT_OWNER", "ADMIN", "CUSTOMER"]),
  (req, res) => eventTicketController.getTicketById(req, res),
);

router.get(
  "/tickets-user/:userId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "EVENT_OWNER", "ADMIN", "CUSTOMER"]),
  (req, res) => eventTicketController.getTicketByUserId(req, res),
);

router.get(
  "/orders-tickets/:orderId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "EVENT_OWNER", "ADMIN", "CUSTOMER"]),
  (req, res) => eventTicketController.getTicketByOrderId(req, res),
);

// event ticket type
router.post(
  "/ticket/type/create",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  (req, res) => eventTicketTypeController.create(req, res),
);

router.put(
  "/ticket/type/update/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  (req, res) => eventTicketTypeController.update(req, res),
);

router.delete(
  "/ticket/type/delete/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "EVENT_OWNER"]),
  (req, res) => eventTicketTypeController.delete(req, res),
);

router.get("/ticket/type/event/:eventId", (req, res) =>
  eventTicketTypeController.getByEvent(req, res),
);

// event order
router.post(
  "/order/checkout-ticket",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => eventOrderController.checkout(req, res),
);

router.post("/order/ticket-payment/webhook", (req, res) =>
  eventOrderController.paymentWebhook(req, res),
);

router.get(
  "/detail-order/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => eventOrderController.getDetail(req, res),
);

export default router;
