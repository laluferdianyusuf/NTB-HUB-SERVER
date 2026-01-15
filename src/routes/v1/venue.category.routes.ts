import { VenueCategoryController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueCategoryController = new VenueCategoryController();

router.post("/create", auth.authorize(["ADMIN"]), (req, res) =>
  venueCategoryController.createCategory(req, res)
);

router.get("/categories", (req, res) =>
  venueCategoryController.getAllCategory(req, res)
);

export default router;
