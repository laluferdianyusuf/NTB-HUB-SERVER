import { Router } from "express";

// V1
import authRouter from "./v1/auth.routes";
import bookingRouter from "./v1/booking.routes";
import deviceRouter from "./v1/device.routes";
import eventRouter from "./v1/event.routes";
import eventTicketTypeRouter from "./v1/event.ticket.types.routes";
import floorRouter from "./v1/floor.routes";
import invitationRouter from "./v1/invitation.routes";
import invoiceRouter from "./v1/invoice.routes";
import locationRouter from "./v1/location.routes";
import logsRouter from "./v1/logs.routes";
import menuRouter from "./v1/menu.routes";
import newsRouter from "./v1/news.routes";
import notificationRouter from "./v1/notification.routes";
import operationalRouter from "./v1/operational.routes";
import orderRouter from "./v1/order.routes";
import paymentRouter from "./v1/payment.routes";
import pointsRouter from "./v1/points.routes";
import publicPlaceRouter from "./v1/public.place.routes";
import reviewPlaceRouter from "./v1/review.place.routes";
import reviewRouter from "./v1/review.routes";
import userBalanceRouter from "./v1/userBalance.routes";
import usersRouter from "./v1/users.routes";
import venueCategoryRouter from "./v1/venue.category.routes";
import venueRouter from "./v1/venue.routes";
import venueServiceRouter from "./v1/venue.service.routes";
import venueStaffRouter from "./v1/venue.staff.routes";
import venueSubCategoryRouter from "./v1/venue.subCategory.routes";
import venueUnitRouter from "./v1/venue.units.routes";
import venueBalanceRouter from "./v1/venueBalance.routes";
import withdrawRouter from "./v1/withdraw.routes";

// V2
import commentRouter from "./v1/comment.routes";
import communityEventAttendanceRouter from "./v1/community-event-attendance.routes";
import communityEventRouter from "./v1/community-event.routes";
import communityTwibbonRouter from "./v1/community-twibbon.routes";
import communityMemberRouter from "./v1/community.member.routes";
import communityPostRouter from "./v1/community.post.routes";
import communityReactionRouter from "./v1/community.reaction.routes";
import communityRouter from "./v1/community.routes";
import eventAttendanceRouter from "./v1/event-attendance.routes";
import ledgerRouter from "./v1/ledger.routes";
import mapsRouter from "./v1/maps.routes";
import profileRouter from "./v1/profile.routes";
import promotionRouter from "./v1/promotion.routes";
import searchRouter from "./v1/search.routes";
import taskRouter from "./v1/task.routes";
import urlPreviewRouter from "./v1/url-preview.routes";

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
v1.use("/payment", paymentRouter);
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

// v2
v1.use("/maps", mapsRouter);
v1.use("/communities", communityRouter);
v1.use("/community-members", communityMemberRouter);
v1.use("/community-posts", communityPostRouter);
v1.use("/community-reactions", communityReactionRouter);
v1.use("/community-events", communityEventRouter);
v1.use("/community-twibbons", communityTwibbonRouter);
v1.use("/comments", commentRouter);
v1.use("/urls", urlPreviewRouter);
v1.use("/ledger", ledgerRouter);
v1.use("/community-attendances", communityEventAttendanceRouter);
v1.use("/attendances", eventAttendanceRouter);

v1.use("/tasks", taskRouter);
v1.use("/profiles", profileRouter);
v1.use("/search", searchRouter);
v1.use("/promotion", promotionRouter);

// mount v1 API
router.use("/api/v1", v1);

// mount deprecated versions (v2–v17)
router.use(deprecatedRouters);

export default router;
