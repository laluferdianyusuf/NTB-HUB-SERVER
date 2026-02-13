import { CommunityPostController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const controller = new CommunityPostController();
const auth = new AuthMiddlewares();

router.get("/list/:communityId", auth.authenticate, (req, res) =>
  controller.getPosts(req, res),
);

router.post(
  "/create/:communityId",
  upload.single("image"),
  auth.authenticate,
  (req, res) => controller.addPost(req, res),
);

router.put("/update/:postId", auth.authenticate, (req, res) =>
  controller.updatePost(req, res),
);

router.delete("/delete/:postId", auth.authenticate, (req, res) =>
  controller.deletePost(req, res),
);

export default router;
