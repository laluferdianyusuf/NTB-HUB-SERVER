import { CommunityController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const controller = new CommunityController();
const auth = new AuthMiddlewares();

router.post(
  "/create-community",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  upload.single("image"),
  (req, res) => controller.createCommunity(req, res),
);

router.get("/list/:userId", auth.authenticate, (req, res) =>
  controller.findAll(req, res),
);

router.get("/list-public", auth.authenticate, (req, res) =>
  controller.findAllPublic(req, res),
);

router.get("/detail/:id", auth.authenticate, (req, res) =>
  controller.findById(req, res),
);

router.put("/update/:id", auth.authenticate, (req, res) =>
  controller.update(req, res),
);

router.delete("/delete/:id", auth.authenticate, (req, res) =>
  controller.delete(req, res),
);

router.get("/members/:id", auth.authenticate, (req, res) =>
  controller.getMembers(req, res),
);

export default router;
