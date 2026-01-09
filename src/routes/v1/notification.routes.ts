import { NotificationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const auth = new AuthMiddlewares();

const router = Router();
const notificationController = new NotificationController();

router.post("/notification/user", (req, res) =>
  notificationController.createNotification(req, res)
);
router.get("/notification", auth.authorize(["CUSTOMER"]), (req, res) =>
  notificationController.getNotification(req, res)
);
router.get("/notification/grouped", auth.authorize(["CUSTOMER"]), (req, res) =>
  notificationController.getGroupedNotifications(req, res)
);
router.get("/notification/venue", auth.authorize(["VENUE"]), (req, res) =>
  notificationController.getNotificationByVenue(req, res)
);
router.put("/notification/read", auth.authorize(["CUSTOMER"]), (req, res) =>
  notificationController.markAllAsRead(req, res)
);
router.put("/notification/unread", auth.authorize(["CUSTOMER"]), (req, res) =>
  notificationController.markAllAsUnread(req, res)
);

export default router;
