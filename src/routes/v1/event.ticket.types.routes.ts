import { EventTicketTypeController } from "controllers";
import { Router } from "express";

const router = Router();
const controller = new EventTicketTypeController();

router.post("/create-ticket", (req, res) => controller.create(req, res));

router.get("/event-ticket/:eventId", (req, res) =>
  controller.getByEvent(req, res),
);

router.put("/update-ticket/:id", (req, res) => controller.update(req, res));

router.delete("/delete-ticket/:id", (req, res) => controller.delete(req, res));

export default router;
