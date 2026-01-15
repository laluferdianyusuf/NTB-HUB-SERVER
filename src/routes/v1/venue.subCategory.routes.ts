import { VenueSubCategoryController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const venueSubCategoryController = new VenueSubCategoryController();

router.post("/create", auth.authorize(["ADMIN"]), (req, res) =>
  venueSubCategoryController.createSubCategory(req, res)
);

router.get("/by-category/:categoryId", (req, res) =>
  venueSubCategoryController.getSubCategoryByCategory(req, res)
);

router.get("/sub-all", (req, res) =>
  venueSubCategoryController.getAllSubCategory(req, res)
);

export default router;
