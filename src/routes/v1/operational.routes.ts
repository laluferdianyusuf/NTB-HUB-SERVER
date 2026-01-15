import { OperationalControllers } from "controllers";
import { Router } from "express";

const router = Router();
const operationalController = new OperationalControllers();

router.post("/operate/create/:venueId", (req, res) =>
  operationalController.createOperationalHours(req, res)
);

router.get("/operate/venue/:venueId", (req, res) =>
  operationalController.getOperationalHours(req, res)
);

export default router;
