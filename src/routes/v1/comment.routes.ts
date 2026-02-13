import { CommentController } from "controllers/comment.controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const auth = new AuthMiddlewares();

const router = Router();
const ctrl = new CommentController();

router.get("/list/:entityType/:entityId", auth.authenticate, (req, res) =>
  ctrl.list(req, res),
);
router.post("/create", auth.authenticate, (req, res) => ctrl.create(req, res));
router.post("/like/:commentId", auth.authenticate, (req, res) =>
  ctrl.like(req, res),
);
router.post("/report/:commentId", auth.authenticate, (req, res) =>
  ctrl.report(req, res),
);
router.delete("/delete/:commentId", auth.authenticate, (req, res) =>
  ctrl.delete(req, res),
);

export default router;
