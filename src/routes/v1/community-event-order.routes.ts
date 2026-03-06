import { CommunityEventOrderController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();

const controller = new CommunityEventOrderController();
const auth = new AuthMiddlewares();

router.get("/orders", auth.authenticate, (req, res) =>
  controller.getEventOrders(req, res),
);

export default router;
