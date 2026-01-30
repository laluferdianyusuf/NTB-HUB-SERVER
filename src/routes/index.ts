import { Router } from "express";

import authRouter from "./v1/auth.routes";
import usersRouter from "./v1/users.routes";
import venueRouter from "./v1/venue.routes";
import floorRouter from "./v1/floor.routes";
import menuRouter from "./v1/menu.routes";
import bookingRouter from "./v1/booking.routes";
import transactionRouter from "./v1/transaction.routes";
import orderRouter from "./v1/order.routes";
import locationRouter from "./v1/location.routes";
import notificationRouter from "./v1/notification.routes";
import invitationRouter from "./v1/invitation.routes";
import userBalanceRouter from "./v1/userBalance.routes";
import venueBalanceRouter from "./v1/venueBalance.routes";
import pointsRouter from "./v1/points.routes";
import logsRouter from "./v1/logs.routes";
import reviewRouter from "./v1/review.routes";
import reviewPlaceRouter from "./v1/review.place.routes";
import newsRouter from "./v1/news.routes";
import invoiceRouter from "./v1/invoice.routes";
import deviceRouter from "./v1/device.routes";
import operationalRouter from "./v1/operational.routes";
import withdrawRouter from "./v1/withdraw.routes";
import eventRouter from "./v1/event.routes";
import eventTicketTypeRouter from "./v1/event.ticket.types.routes";
import publicPlaceRouter from "./v1/public.place.routes";
import venueCategoryRouter from "./v1/venue.category.routes";
import venueSubCategoryRouter from "./v1/venue.subCategory.routes";
import venueServiceRouter from "./v1/venue.service.routes";
import venueUnitRouter from "./v1/venue.units.routes";
import venueStaffRouter from "./v1/venue.staff.routes";

import { deprecatedRouters } from "./deprecated";

const router = Router();

// v1 router group
const v1 = Router();

v1.use("/auth", authRouter);
v1.use("/bookings", bookingRouter);
v1.use("/devices", deviceRouter);
v1.use("/events", eventRouter);
v1.use("/floors", floorRouter);
v1.use("/invitations", invitationRouter);
v1.use("/invoice", invoiceRouter);
v1.use("/locations", locationRouter);
v1.use("/logs", logsRouter);
v1.use("/menus", menuRouter);
v1.use("/news", newsRouter);
v1.use("/notifications", notificationRouter);
v1.use("/operational", operationalRouter);
v1.use("/orders", orderRouter);
v1.use("/points", pointsRouter);
v1.use("/ticket-type", eventTicketTypeRouter);
v1.use("/public-places", publicPlaceRouter);
v1.use("/transactions", transactionRouter);
v1.use("/reviews", reviewRouter);
v1.use("/reviews-place", reviewPlaceRouter);
v1.use("/users", usersRouter);
v1.use("/user-balance", userBalanceRouter);
v1.use("/venues", venueRouter);
v1.use("/venue-balance", venueBalanceRouter);
v1.use("/venue-category", venueCategoryRouter);
v1.use("/venue-service", venueServiceRouter);
v1.use("/venue-sub-category", venueSubCategoryRouter);
v1.use("/venue-unit", venueUnitRouter);
v1.use("/venue-staff", venueStaffRouter);
v1.use("/withdraw", withdrawRouter);

// mount v1 API
router.use("/api/v1", v1);

// mount deprecated versions (v2–v17)
router.use(deprecatedRouters);

export default router;
