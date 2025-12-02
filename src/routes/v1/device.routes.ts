import { DeviceController } from "controllers";
import { Router } from "express";

const router = Router();
const deviceController = new DeviceController();

router.post("/register", (req, res) =>
  deviceController.registerDevice(req, res)
);
router.get("/get/byUser/:userId", (req, res) =>
  deviceController.getUserDevices(req, res)
);
router.delete("/unregister/:userId", (req, res) =>
  deviceController.unregister(req, res)
);

export default router;
