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

router.get("/event/dashboard/:eventId", auth.authenticate, (req, res) =>
  eventController.getCommunityEventDashboard(req, res),
);

// event scan qr code
router.post("/scan-community-qrCode", auth.authenticate, (req, res) =>
  eventOrderController.scanQrCode(req, res),
);

// event ticket DETAIL
router.get(
  "/detail-ticket/:id",
  auth.authenticate,

  (req, res) => eventTicketController.getTicketById(req, res),
);

router.get(
  "/tickets-user/:userId",
  auth.authenticate,

  (req, res) => eventTicketController.getTicketByUserId(req, res),
);

router.get(
  "/orders-tickets/:orderId",
  auth.authenticate,

  (req, res) => eventTicketController.getTicketByOrderId(req, res),
);

// event ticket type
router.post(
  "/ticket/type/create/:communityEventId",
  auth.authenticate,
  (req, res) => eventTicketTypeController.createTicketType(req, res),
);

router.get("/ticket/type/event/:communityEventId", (req, res) =>
  eventTicketTypeController.findAllTicketTypes(req, res),
);

// event order
// router.post("/order/checkout-ticket", auth.authenticate, (req, res) =>
//   eventOrderController.createOrder(req, res),
// );

// router.post("/order/ticket-payment/webhook", auth.authenticate, (req, res) =>
//   eventOrderController.handlePaymentSuccess(req, res),
// );

router.post("/order/checkout-pay", auth.authenticate, (req, res) =>
  eventOrderController.checkoutAndPay(req, res),
);

router.get("/detail-order/:id", auth.authenticate, (req, res) =>
  eventOrderController.getDetail(req, res),
);

router.get("/orders", auth.authenticate, (req, res) =>
  eventOrderController.getEventOrders(req, res),
);

router.post("/scan-qrCode", auth.authenticate, (req, res) =>
  eventOrderController.scanQrCode(req, res),
);

export default router;
