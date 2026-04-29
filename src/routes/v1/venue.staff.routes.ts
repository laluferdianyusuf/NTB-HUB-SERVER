import { VenueStaffController } from "controllers";
import express from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = express.Router();

const controller = new VenueStaffController();
const auth = new AuthMiddlewares();

router.post("/create/:venueId", auth.authenticate, (req, res) =>
  controller.create(req, res),
);

router.get("/list", auth.authenticate, (req, res) => controller.list(req, res));

router.get("/detail/:staffId", auth.authenticate, (req, res) =>
  controller.detail(req, res),
);

router.put("/update/:staffId", auth.authenticate, (req, res) =>
  controller.update(req, res),
);

router.delete("/delete/:staffId", auth.authenticate, (req, res) =>
  controller.delete(req, res),
);

export default router;
