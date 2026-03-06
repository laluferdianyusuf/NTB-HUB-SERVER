import { UserController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const userController = new UserController();

router.get("/all-users", auth.authenticate, (req, res) =>
  userController.findAllUsers(req, res),
);
router.get("/all-top-spender", auth.authenticate, (req, res) =>
  userController.findTopSpender(req, res),
);
router.get("/detail-user/:userId", (req, res) =>
  userController.findDetailUser(req, res),
);
router.patch(
  "/manage-profile",
  auth.authenticate,
  upload.single("image"),
  (req, res) => userController.updateUser(req, res),
);

router.patch("/change-password", auth.authenticate, (req, res) =>
  userController.changePassword(req, res),
);

router.post("/reset-password", (req, res) =>
  userController.resetPassword(req, res),
);

router.post("/forgot-password", (req, res) =>
  userController.forgotPassword(req, res),
);
router.delete(
  "/delete-user/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => userController.deleteUser(req, res),
);

export default router;
