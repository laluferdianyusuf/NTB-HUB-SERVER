import { CommunityTwibbonController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const controller = new CommunityTwibbonController();
const auth = new AuthMiddlewares();

router.get("/list/:communityId", auth.authenticate, (req, res) =>
  controller.getActive(req, res),
);

router.post(
  "/create/:communityId",
  upload.single("image"),
  auth.authenticate,
  (req, res) => controller.create(req, res),
);

router.put("/update/:twibbonId", auth.authenticate, (req, res) =>
  controller.update(req, res),
);

router.delete("/delete/:twibbonId", auth.authenticate, (req, res) =>
  controller.delete(req, res),
);

export default router;
