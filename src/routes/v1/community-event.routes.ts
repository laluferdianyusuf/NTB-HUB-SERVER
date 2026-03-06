import {
  CommunityEventController,
  CommunityEventOrderController,
  CommunityEventTicketController,
  CommunityEventTicketTypeController,
} from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const eventController = new CommunityEventController();
const eventTicketController = new CommunityEventTicketController();
const eventTicketTypeController = new CommunityEventTicketTypeController();
const eventOrderController = new CommunityEventOrderController();
const auth = new AuthMiddlewares();

router.get("/list/:communityId", auth.authenticate, (req, res) =>
  eventController.listByCommunity(req, res),
);

router.post(
  "/create-event/:communityId",
  auth.authenticate,
  upload.single("image"),
  (req, res) => eventController.create(req, res),
);

router.post("/create-collaboration", auth.authenticate, (req, res) =>
  eventController.addCollaboration(req, res),
);

router.get("/detail/:eventId", auth.authenticate, (req, res) =>
  eventController.detail(req, res),
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
  (req, res) => eventTicketTypeController.createTicketType(req, res),
);

router.get("/ticket/type/event/:eventId", (req, res) =>
  eventTicketTypeController.findAllTicketTypes(req, res),
);

// event order
router.post(
  "/order/checkout-ticket",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => eventOrderController.createOrder(req, res),
);

router.post("/order/ticket-payment/webhook", (req, res) =>
  eventOrderController.handlePaymentSuccess(req, res),
);

router.get(
  "/detail-order/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => eventOrderController.getDetail(req, res),
);

router.get(
  "/orders",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => eventOrderController.getEventOrders(req, res),
);

export default router;
