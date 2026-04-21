import { CourierController } from "controllers";
import { Router } from "express";

const router = Router();
const controller = new CourierController();

router.post("/assign/:deliveryId", controller.assignDelivery.bind(controller));
router.post("/reject/:deliveryId", controller.rejectDelivery.bind(controller));
router.post("/timeout/:deliveryId", controller.handleTimeout.bind(controller));

export default router;
