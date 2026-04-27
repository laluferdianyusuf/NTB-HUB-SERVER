import { PromotionController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new PromotionController();
const auth = new AuthMiddlewares();

router.post("/create-promotion", auth.authenticate, (req, res) =>
  controller.createPromotion(req, res),
);

router.patch(
  "/approved-promotion/:promotionId",
  auth.authenticate,
  (req, res) => controller.approvePromotion(req, res),
);

router.patch("/reject-promotion/:promotionId", auth.authenticate, (req, res) =>
  controller.rejectPromotion(req, res),
);

router.get("/summary/:venueId", auth.authenticate, (req, res) =>
  controller.getPromotionSummary(req, res),
);

router.get("/by-venue/:venueId", auth.authenticate, (req, res) =>
  controller.getPromotionByVenue(req, res),
);

export default router;
