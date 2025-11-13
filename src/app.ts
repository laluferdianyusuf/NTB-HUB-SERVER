import {
  BookingControllers,
  MenuControllers,
  TableControllers,
  UserController,
  VenueControllers,
  FloorControllers,
  InvitationController,
  UserBalanceController,
  VenueBalanceController,
  PointsController,
  TransactionController,
  OrderControllers,
  LocationController,
  NotificationController,
  LogController,
  ReviewControllers,
  InvoiceController,
} from "./controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import Redis from "ioredis";
import { Server } from "socket.io";
import { upload } from "middlewares/upload";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const auth = new AuthMiddlewares();

const userController = new UserController();
const venueController = new VenueControllers();
const floorController = new FloorControllers();
const tableController = new TableControllers();
const menuController = new MenuControllers();
const bookingController = new BookingControllers();
const transactionController = new TransactionController();
const orderController = new OrderControllers();
const locationController = new LocationController();
const notificationController = new NotificationController();
const invitationController = new InvitationController();
const userBalanceController = new UserBalanceController();
const venueBalanceController = new VenueBalanceController();
const pointsController = new PointsController();
const logsController = new LogController();
const reviewController = new ReviewControllers();
const invoiceController = new InvoiceController();
app.get("/", (req, res) => res.send({ message: "Successful" }));

// Routes
// user & auth
app.get("/api/v1/users", (req, res) => userController.getAll(req, res));
app.get("/api/v1/get-user/:id", (req, res) => userController.getById(req, res));
app.post("/api/v1/auth/register", upload.single("image"), (req, res) =>
  userController.create(req, res)
);
app.post("/api/v1/auth/login", (req, res) => userController.login(req, res));
app.post("/api/v1/auth/refresh", (req, res) =>
  userController.refresh(req, res)
);
app.put(
  "/api/v1/update-user/:id",
  upload.single("image"),
  auth.authenticate.bind(auth),
  (req, res) => userController.update(req, res)
);
app.delete(
  "/api/v1/delete-user/:id",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => userController.delete(req, res)
);
app.post("/api/v1/auth/logout", auth.authenticate.bind(auth), (req, res) =>
  auth.logout(req, res)
);
app.get("/api/v1/auth/current", auth.authenticate.bind(auth), (req, res) =>
  userController.currentUser(req, res)
);

// venue
app.post("/api/v2/venues/sign", (req, res) =>
  venueController.signInWithInvitationKey(req, res)
);
app.post("/api/v2/venue/refresh", (req, res) =>
  venueController.refresh(req, res)
);
app.get("/api/v2/venues", (req, res) => venueController.getVenues(req, res));
app.get("/api/v2/venue/:id", (req, res) =>
  venueController.getVenueById(req, res)
);
app.put(
  "/api/v2/venue/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => venueController.updateVenue(req, res)
);
app.delete("/api/v2/venue/:id", (req, res) =>
  venueController.deleteVenue(req, res)
);
app.post("/api/v2/venue/logout", auth.venueAuth.bind(auth), (req, res) =>
  auth.logoutVenue(req, res)
);
app.get("/api/v2/venue", auth.venueAuth.bind(auth), (req, res) =>
  venueController.currentVenue(req, res)
);

// floor
app.post(
  "/api/v3/venues/:venueId/floors",
  auth.venueAuth.bind(auth),
  (req, res) => floorController.createFloor(req, res) // venue
);
app.get(
  "/api/v3/venues/:venueId/floors",
  auth.authenticate.bind(auth),
  (req, res) => floorController.getFloorByVenueId(req, res)
);
app.get("/api/v3/floor/:id", (req, res) =>
  floorController.getFloorById(req, res)
);
app.put(
  "/api/v3/floor/:id",
  auth.venueAuth.bind(auth),
  (req, res) => floorController.updateFloor(req, res) // venue
);
app.delete(
  "/api/v3/floor/:id",
  auth.venueAuth.bind(auth),
  (req, res) => floorController.deleteFloor(req, res) // venue
);

// table
app.post(
  "/api/v4/floors/:floorId/tables",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.createTable(req, res) // venue
);
app.get(
  "/api/v4/floors/:floorId/tables",
  auth.authenticate.bind(auth),
  (req, res) => tableController.getTableByFloorId(req, res)
);
app.get("/api/v4/table/:id", (req, res) =>
  tableController.getTableById(req, res)
);
app.put(
  "/api/v4/table/:id",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.updateTable(req, res) // venue
);
app.delete(
  "/api/v4/table/:id",
  auth.venueAuth.bind(auth),
  (req, res) => tableController.deleteTable(req, res) // venue
);

// menu
app.post(
  "/api/v5/venues/:venueId/menus",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => menuController.createMenu(req, res) // venue
);
app.get(
  "/api/v5/venues/:venueId/menus",
  auth.authenticate.bind(auth),
  (req, res) => menuController.getMenuByVenueId(req, res)
);
app.get(
  "/api/v5/menus/:id",
  auth.venueAuth.bind(auth),
  (req, res) => menuController.getMenuById(req, res) // venue
);
app.put(
  "/api/v5/menus/:id",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => menuController.updateMenu(req, res)
); // venue
app.delete(
  "/api/v5/menus/:id",
  auth.venueAuth.bind(auth),
  (req, res) => menuController.deleteMenu(req, res) // venue
);

// booking
app.post("/api/v6/bookings", auth.authenticate.bind(auth), (req, res) =>
  bookingController.createBooking(req, res)
);
app.put(
  "/api/v6/payment/:id/booking",
  auth.authenticate.bind(auth),
  (req, res) => bookingController.processBookingPayment(req, res)
);
app.get("/api/v6/bookings", auth.authenticate.bind(auth), (req, res) =>
  bookingController.getAllBookings(req, res)
);
app.get(
  "/api/v6/users/:userId/bookings",
  auth.authenticate.bind(auth),
  (req, res) => bookingController.getBookingByUserId(req, res)
);
app.get("/api/v6/booking/:id", (req, res) =>
  bookingController.getBookingById(req, res)
);
app.put(
  "/api/v6/booking/:id/cancel",
  auth.authenticate.bind(auth),
  (req, res) => bookingController.cancelBooking(req, res)
);
app.put(
  "/api/v6/booking/:id/complete",
  auth.authenticate.bind(auth),
  (req, res) => bookingController.completeBooking(req, res)
);

// transaction
app.post("/api/v7/topUp", auth.authenticate.bind(auth), (req, res) =>
  transactionController.topUp(req, res)
);
app.post("/api/v7/transaction/callback", (req, res) =>
  transactionController.midtransCallback(req, res)
);
app.get(
  "/api/v7/transactions",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => transactionController.findAllTransactions(req, res)
);

// order
app.post("/api/v8/orders", auth.authenticate.bind(auth), (req, res) =>
  orderController.createNewOrder(req, res)
);
app.put("/api/v8/orders/:id", auth.authenticate.bind(auth), (req, res) =>
  orderController.updateOrder(req, res)
);
app.delete("/api/v8/orders/:id", auth.authenticate.bind(auth), (req, res) =>
  orderController.deleteOrder(req, res)
);
app.get("/api/v8/orders/:id", auth.authenticate.bind(auth), (req, res) =>
  orderController.getOrderById(req, res)
);
app.get("/api/v8/orders", auth.authenticate.bind(auth), (req, res) =>
  orderController.findAllOrders(req, res)
);
app.get("/api/v8/:bookingId/orders", auth.authenticate.bind(auth), (req, res) =>
  orderController.findByBookingId(req, res)
);
app.put(
  "/api/v8/orders/:bookingId/payments",
  auth.authenticate.bind(auth),
  (req, res) => orderController.processOrderPayment(req, res)
);

// location
app.post("/api/v9/user/location", (req, res) =>
  locationController.track(req, res)
);
app.get("/api/v9/user/:userId/location", (req, res) =>
  locationController.getLocations(req, res)
);

// notification
app.post("/api/v10/users/notifications", upload.single("image"), (req, res) =>
  notificationController.createNotification(req, res)
);
app.get("/api/v10/users/:userId/notifications", (req, res) =>
  notificationController.getNotification(req, res)
);
app.put("/api/v10/notification/:id/read", (req, res) =>
  notificationController.markRead(req, res)
);
app.delete("/api/v10/notification/:id");

// invitation
app.post(
  "/api/v11/venue/invitation",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => invitationController.generateInvitationKey(req, res)
);
app.get("/api/v11/venue/invitations", (req, res) =>
  invitationController.findAllInvitationKeys(req, res)
);
app.get("/api/v11/venue/invitation/:key", (req, res) =>
  invitationController.findInvitationKey(req, res)
);
app.get("/api/v11/venue/:venueId/invitations", (req, res) =>
  invitationController.findInvitationKeyByVenueId(req, res)
);

// user balance
app.get(
  "/api/v12/user/:userId/balance",
  auth.authenticate.bind(auth),
  (req, res) => userBalanceController.getUserBalance(req, res)
);

// venue balance
app.get("/api/v13/venue/:venueId/balance", (req, res) =>
  venueBalanceController.getVenueBalance(req, res)
);

// points
app.get(
  "/api/v14/user/:userId/points",
  auth.authenticate.bind(auth),
  (req, res) => pointsController.getUserTotalPoints(req, res)
);

// logs
app.get("/api/v15/logs", (req, res) => logsController.getAllLogs(req, res));
app.get("/api/v15/logs/user/:userId", (req, res) =>
  logsController.findLogByUserId(req, res)
);

// review
app.post(
  "/api/v16/review",
  auth.authenticate.bind(auth),
  upload.single("image"),
  (req, res) => reviewController.createReview(req, res)
);
app.get("/api/v16/review/:venueId", (req, res) =>
  reviewController.getVenueRating(req, res)
);

// invoice
app.get("/api/v17/invoices", auth.authenticate.bind(auth), (req, res) =>
  invoiceController.findAllInvoice(req, res)
);
app.get(
  "/api/v17/:bookingId/invoices",
  auth.authenticate.bind(auth),
  (req, res) => invoiceController.findInvoiceByBookingId(req, res)
);

export { app, io, server, Redis };
