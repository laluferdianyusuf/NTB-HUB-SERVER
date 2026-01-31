import { ReviewControllers, ReviewPlaceControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const reviewController = new ReviewPlaceControllers();

router.post(
  "/create-review",
  auth.authenticate,
  upload.single("image"),
  (req, res) => reviewController.createReview(req, res),
);

router.get("/detail-review/:id", (req, res) =>
  reviewController.getReviewById(req, res),
);

router.get("/rating/:placeId", (req, res) =>
  reviewController.getPlaceRating(req, res),
);

export default router;
