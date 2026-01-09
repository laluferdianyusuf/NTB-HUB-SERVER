import { UserController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const userController = new UserController();

router.post("/register", upload.single("image"), (req, res) =>
  userController.create(req, res)
);
router.post("/login", (req, res) => userController.login(req, res));
router.post("/refresh", (req, res) => userController.refresh(req, res));
router.post("/logout", auth.authenticate.bind(auth), (req, res) =>
  auth.logout(req, res)
);
router.post("/google", (req, res) => userController.googleLogin(req, res));
router.get("/me", auth.authorize(["CUSTOMER", "ADMIN", "VENUE"]), (req, res) =>
  userController.currentUser(req, res)
);

export default router;
