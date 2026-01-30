import { UserController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const userController = new UserController();

router.get("/user/users", auth.authorize(["ADMIN", "CUSTOMER"]), (req, res) =>
  userController.getAll(req, res),
);
router.get("/user/:id", (req, res) => userController.getById(req, res));
router.put(
  "/user/update/:id",
  upload.single("image"),
  auth.authorize(["CUSTOMER"]),
  (req, res) => userController.update(req, res),
);
router.delete("/user/delete/:id", auth.authorize(["ADMIN"]), (req, res) =>
  userController.delete(req, res),
);

export default router;
