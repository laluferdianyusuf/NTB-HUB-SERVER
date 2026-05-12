import { InterestController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();

const controller = new InterestController();
const auth = new AuthMiddlewares();

router.get("/", (req, res) => controller.getAll(req, res));

router.get("/me", auth.authenticate, (req, res) =>
  controller.getMine(req, res),
);

router.put("/update/me", auth.authenticate, (req, res) =>
  controller.updateMine(req, res),
);

export default router;
