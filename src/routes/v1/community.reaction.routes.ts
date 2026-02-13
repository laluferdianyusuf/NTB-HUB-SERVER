import { CommunityReactionController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new CommunityReactionController();
const auth = new AuthMiddlewares();

router.get("/list/:postId", auth.authenticate, (req, res) =>
  controller.getReactions(req, res),
);

router.post("/add/:postId", auth.authenticate, (req, res) =>
  controller.addReaction(req, res),
);

router.delete("/remove/:reactionId", auth.authenticate, (req, res) =>
  controller.removeReaction(req, res),
);

export default router;
