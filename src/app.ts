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
} from "./controllers";
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { OrderControllers } from "controllers/order.controllers";
import { LocationController } from "controllers/location.controllers";
import { NotificationController } from "controllers/notification.controllers";
import { TransactionController } from "controllers/transaction.controllers";

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

const userController = new UserController(io);
const venueController = new VenueControllers();
const floorController = new FloorControllers();
const tableController = new TableControllers();
const menuController = new MenuControllers();
const bookingController = new BookingControllers(io);
const transactionController = new TransactionController(io);
const orderController = new OrderControllers();
const locationController = new LocationController(io);
const notificationController = new NotificationController(io);
const invitationController = new InvitationController();
const userBalanceController = new UserBalanceController();
const venueBalanceController = new VenueBalanceController();
const pointsController = new PointsController(io);
app.get("/", (req, res) => res.send({ message: "Successful" }));

// Routes
// user & auth
app.get("/api/v1/users", (req, res) => userController.getAll(req, res));
app.get("/api/v1/get-user/:id", (req, res) => userController.getById(req, res));
app.post("/api/v1/auth/register", (req, res) =>
  userController.create(req, res)
);
app.post("/api/v1/auth/login", (req, res) => userController.login(req, res));
app.put("/api/v1/update-user/:id", (req, res) =>
  userController.update(req, res)
);
app.delete("/api/v1/delete-user/:id", (req, res) =>
  userController.delete(req, res)
);

// venue
app.get("/api/v2/venues", (req, res) => venueController.getVenues(req, res));
app.get("/api/v2/venue/:id", (req, res) =>
  venueController.getVenueById(req, res)
);
app.put("/api/v2/venue/:id", (req, res) =>
  venueController.updateVenue(req, res)
);
app.delete("/api/v2/venue/:id", (req, res) =>
  venueController.deleteVenue(req, res)
);

// floor
app.post("/api/v3/venues/:venueId/floors", (req, res) =>
  floorController.createFloor(req, res)
);
app.get("/api/v3/venues/:venueId/floors", (req, res) =>
  floorController.getFloorByVenueId(req, res)
);
app.get("/api/v3/floor/:id", (req, res) =>
  floorController.getFloorById(req, res)
);
app.put("/api/v3/floor/:id", (req, res) =>
  floorController.updateFloor(req, res)
);
app.delete("/api/v3/floor/:id", (req, res) =>
  floorController.deleteFloor(req, res)
);

// table
app.post("/api/v4/floors/:floorId/tables", (req, res) =>
  tableController.createTable(req, res)
);
app.get("/api/v4/floors/:floorId/tables", (req, res) =>
  tableController.getTableByFloorId(req, res)
);
app.get("/api/v4/table/:id", (req, res) =>
  tableController.getTableById(req, res)
);
app.put("/api/v4/table/:id", (req, res) =>
  tableController.updateTable(req, res)
);
app.delete("/api/v4/table/:id", (req, res) =>
  tableController.deleteTable(req, res)
);

// menu
app.post("/api/v5/venues/:venueId/menus", (req, res) =>
  menuController.createMenu(req, res)
);
app.get("/api/v5/venues/:venueId/menus", (req, res) =>
  menuController.getMenuByVenueId(req, res)
);
app.get("/api/v5/menus/:id", (req, res) =>
  menuController.getMenuById(req, res)
);
app.put("/api/v5/menus/:id", (req, res) => menuController.updateMenu(req, res));
app.delete("/api/v5/menus/:id", (req, res) =>
  menuController.deleteMenu(req, res)
);

// booking
app.post("/api/v6/bookings", (req, res) =>
  bookingController.createBooking(req, res)
);
app.get("/api/v6/bookings", (req, res) =>
  bookingController.getAllBookings(req, res)
);
app.get("/api/v6/users/:userId/bookings", (req, res) =>
  bookingController.getBookingByUserId(req, res)
);
app.get("/api/v6/booking/:id", (req, res) =>
  bookingController.getBookingById(req, res)
);
app.put("/api/v6/booking/:id/cancel", (req, res) =>
  bookingController.cancelBooking(req, res)
);
app.put("/api/v6/booking/:id/complete", (req, res) =>
  bookingController.completeBooking(req, res)
);

// transaction
app.post("/api/v7/topUp", (req, res) => transactionController.topUp(req, res));
app.post("/api/v7/transaction/callback", (req, res) =>
  transactionController.midtransCallback(req, res)
);
app.get("/api/v7/transactions", (req, res) =>
  transactionController.findAllTransactions(req, res)
);

// order
app.post("/api/v8/orders", (req, res) =>
  orderController.createNewOrder(req, res)
);
app.put("/api/v8/orders/:id", (req, res) =>
  orderController.updateOrder(req, res)
);
app.delete("/api/v8/orders/:id", (req, res) =>
  orderController.deleteOrder(req, res)
);
app.get("/api/v8/orders/:id", (req, res) =>
  orderController.getOrderById(req, res)
);

// location
app.post("/api/v9/user/location", (req, res) =>
  locationController.track(req, res)
);
app.get("/api/v9/user/:userId/location", (req, res) =>
  locationController.getLocations(req, res)
);

// notification
app.post("/api/v10/users/notifications", (req, res) =>
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
app.post("/api/v11/venue/invitation", (req, res) =>
  invitationController.generateInvitationKey(req, res)
);

// user balance
app.get("/api/v12/user/:userId/balance", (req, res) =>
  userBalanceController.getUserBalance(req, res)
);

// venue balance
app.get("/api/v13/venue/:venueId/balance", (req, res) =>
  venueBalanceController.getVenueBalance(req, res)
);

// points
app.get("/api/v14/user/:userId/points", (req, res) =>
  pointsController.getUserTotalPoints(req, res)
);

export { app, io, server };
