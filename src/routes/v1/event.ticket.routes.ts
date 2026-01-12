import { Router } from "express";
import { EventTicketController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new EventTicketController();
const auth = new AuthMiddlewares();

router.post("/ticket/scan", auth.authorize(["VENUE"]), controller.scan);

export default router;
