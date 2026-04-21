import { AccountController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new AccountController();
const auth = new AuthMiddlewares();

router.post("/ensure", auth.authenticate, (req, res) =>
  controller.ensureAccount(req, res),
);

export default router;
