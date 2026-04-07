import { TaskController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new TaskController();
const auth = new AuthMiddlewares();

router.post("/create", auth.authenticate, (req, res) =>
  controller.create(req, res),
);
router.post("/generate/:taskId/qr", auth.authenticate, (req, res) =>
  controller.generateQr(req, res),
);
router.post("/verify", auth.authenticate, (req, res) =>
  controller.verify(req, res),
);

router.get("/list-tasks", auth.authenticate, (req, res) =>
  controller.findAllWithStatus(req, res),
);

router.get("/all/list-tasks", auth.authenticate, (req, res) =>
  controller.findAll(req, res),
);

export default router;
