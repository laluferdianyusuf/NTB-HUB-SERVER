import { ReviewControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const reviewController = new ReviewControllers();

router.post(
  "/review",
  auth.authenticate.bind(auth),
  upload.single("image"),
  (req, res) => reviewController.createReview(req, res)
);
router.get("/review/:venueId", (req, res) =>
  reviewController.getVenueRating(req, res)
);

export default router;
