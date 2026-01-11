import { Router } from "express";
import { EventController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new EventController();
const auth = new AuthMiddlewares();

// PUBLIC
router.get("/list", controller.listEvent);
router.get("/detail/:id", controller.detailEvent);

// ADMIN
router.post("/create", auth.authorize(["ADMIN"]), controller.create);

router.put(
  "/update/:id/status",
  auth.authorize(["ADMIN"]),
  controller.updateStatusEvent
);

router.delete("/remove/:id", auth.authorize(["ADMIN"]), controller.removeEvent);

export default router;
