import { NotificationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const auth = new AuthMiddlewares();

const router = Router();
const notificationController = new NotificationController();

router.post("/notification/user", (req, res) =>
  notificationController.createNotification(req, res),
);
router.get(
  "/notification",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => notificationController.getNotification(req, res),
);
router.get(
  "/notification/grouped",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => notificationController.getGroupedNotifications(req, res),
);
router.get(
  "/notification/venue/:venueId",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => notificationController.getNotificationByVenue(req, res),
);
router.put(
  "/notification/read",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => notificationController.markAllAsRead(req, res),
);
router.put(
  "/notification/unread",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => notificationController.markAllAsUnread(req, res),
);

export default router;
