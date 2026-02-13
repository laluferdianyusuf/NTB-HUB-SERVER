import { CommunityEventController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const controller = new CommunityEventController();
const auth = new AuthMiddlewares();

router.get("/list/:communityId", auth.authenticate, (req, res) =>
  controller.listByCommunity(req, res),
);

router.post(
  "/create-event/:communityId",
  auth.authenticate,
  upload.single("image"),
  (req, res) => controller.create(req, res),
);

router.post("/create-collaboration", auth.authenticate, (req, res) =>
  controller.addCollaboration(req, res),
);

router.get("/detail/:eventId", auth.authenticate, (req, res) =>
  controller.detail(req, res),
);

export default router;
