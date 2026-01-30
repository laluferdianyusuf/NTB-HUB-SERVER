import { UserController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const userController = new UserController();

router.get(
  "/all-users",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN", "CUSTOMER"]),
  (req, res) => userController.findAllUsers(req, res),
);
router.get("/detail-user/:userId", (req, res) =>
  userController.findDetailUser(req, res),
);
router.put(
  "/update-user/:id",
  upload.single("image"),
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => userController.updateUser(req, res),
);
router.delete(
  "/delete-user/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => userController.deleteUser(req, res),
);

export default router;
