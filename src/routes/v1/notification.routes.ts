import { NotificationController } from "controllers";
import { Router } from "express";
import { upload } from "middlewares/upload";

const router = Router();
const notificationController = new NotificationController();

router.post("/users/notifications", upload.single("image"), (req, res) =>
  notificationController.createNotification(req, res)
);
router.get("/users/:userId/notifications", (req, res) =>
  notificationController.getNotification(req, res)
);
router.put("/notification/:id/read", (req, res) =>
  notificationController.markRead(req, res)
);
router.delete("/notification/:id", (req, res) => {});

export default router;
