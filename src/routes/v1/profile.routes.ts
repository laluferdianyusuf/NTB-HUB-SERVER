import { ProfileController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new ProfileController();
const auth = new AuthMiddlewares();

router.get("/detail/:id", auth.authenticate, (req, res) =>
  controller.getProfile(req, res),
);
router.post("/:id/view", auth.authenticate, (req, res) =>
  controller.viewProfile(req, res),
);
router.post("/:id/like", auth.authenticate, (req, res) =>
  controller.toggleLike(req, res),
);

export default router;
