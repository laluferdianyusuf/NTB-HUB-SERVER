import { Router } from "express";
import { EventTicketTypeController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new EventTicketTypeController();
const auth = new AuthMiddlewares();

router.post("/create", auth.authorize(["ADMIN"]), controller.create);

router.put("/update/:id", auth.authorize(["ADMIN"]), controller.update);

router.delete("/delete/:id", auth.authorize(["ADMIN"]), controller.delete);

router.get("/event/:eventId", controller.getByEvent);

export default router;
