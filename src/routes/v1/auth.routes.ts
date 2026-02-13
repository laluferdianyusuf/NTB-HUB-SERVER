import { UserController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const userController = new UserController();

router.post("/register", upload.single("image"), (req, res) =>
  userController.register(req, res),
);
router.post("/login", (req, res) => userController.login(req, res));
router.post("/refresh", (req, res) => userController.refreshToken(req, res));

router.post("/google", (req, res) => userController.googleLogin(req, res));

router.get("/me", auth.authenticate, (req, res) => userController.me(req, res));

router.post(
  "/set-pin/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => userController.setTransactionPin(req, res),
);

router.post(
  "/set-biometric/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => userController.setBiometric(req, res),
);

router.post(
  "/verify-pin/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => userController.verifyPin(req, res),
);

export default router;
