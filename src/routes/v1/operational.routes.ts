import { OperationalControllers } from "controllers";
import { Router } from "express";

const router = Router();
const operationalController = new OperationalControllers();

router.get("/operate/venue/:venueId", (req, res) =>
  operationalController.getOperationalHours(req, res)
);

export default router;
