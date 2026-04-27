import { OperationalControllers } from "controllers";
import { Router } from "express";

const router = Router();
const operationalController = new OperationalControllers();

router.get("/operate/venue/:venueId", (req, res) =>
  operationalController.getOperationalHours(req, res),
);

router.post("/operate/create/:venueId", (req, res) =>
  operationalController.createOperationalHours(req, res),
);

router.patch("/operate/edit/:venueId", (req, res) =>
  operationalController.editHours(req, res),
);

router.patch("/operate/toggle/:venueId", (req, res) =>
  operationalController.toggleDay(req, res),
);

router.patch("/operate/copy-next/:venueId", (req, res) =>
  operationalController.copyNextDay(req, res),
);

router.patch("/operate/holiday/:venueId", (req, res) =>
  operationalController.holidayClosure(req, res),
);

router.patch("/operate/special/:venueId", (req, res) =>
  operationalController.specialEventHours(req, res),
);

export default router;
