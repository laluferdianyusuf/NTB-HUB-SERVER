import { Router } from "express";
import { PublicPlaceController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new PublicPlaceController();
const auth = new AuthMiddlewares();

// public
router.get("/list", controller.list);
router.get("/detail/:id", controller.detail);

// admin only
router.post("/create", auth.authorize(["ADMIN"]), controller.create);
router.put("/update/:id", auth.authorize(["ADMIN"]), controller.update);
router.delete("/delete/:id", auth.authorize(["ADMIN"]), controller.deactivate);

export default router;
