import { PromotionBannerController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new PromotionBannerController();
const auth = new AuthMiddlewares();

// PUBLIC
router.get(
  "/banners",
  auth.authenticate,
  controller.getActiveBanners.bind(controller),
);
router.post(
  "/:id/view",
  auth.authenticate,
  controller.recordView.bind(controller),
);
router.post(
  "/:id/click",
  auth.authenticate,
  controller.recordClick.bind(controller),
);

// ADMIN
router.post(
  "/",
  auth.authenticate,
  controller.createPromotion.bind(controller),
);

router.put(
  "/update/:id",
  auth.authenticate,
  controller.updatePromotion.bind(controller),
);

router.delete(
  "/delete/:id",
  auth.authenticate,
  controller.deactivatePromotion.bind(controller),
);

router.get(
  "/:id/analytics",
  auth.authenticate,
  controller.getAnalytics.bind(controller),
);

export default router;
