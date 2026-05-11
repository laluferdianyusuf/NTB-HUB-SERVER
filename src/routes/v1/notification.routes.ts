import { NotificationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const auth = new AuthMiddlewares();

const router = Router();
const notificationController = new NotificationController();

router.post("/notification/user", (req, res) =>
  notificationController.createNotification(req, res),
);

router.get("/notification", auth.authenticate, (req, res) =>
  notificationController.getNotification(req, res),
);

router.get("/by-recipient/:recipientId", auth.authenticate, (req, res) =>
  notificationController.getNotificationByRecipient(req, res),
);

router.get("/notification/venue/:venueId", auth.authenticate, (req, res) =>
  notificationController.getNotificationByVenue(req, res),
);
router.put("/read/:recipientId", auth.authenticate, (req, res) =>
  notificationController.markAllAsRead(req, res),
);

router.put("/unread/:recipientId", auth.authenticate, (req, res) =>
  notificationController.markAllAsUnread(req, res),
);

export default router;
