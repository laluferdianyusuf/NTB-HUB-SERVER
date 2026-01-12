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

// interactions with place
router.post("/place/:placeId/like", auth.authorize(["CUSTOMER"]), (req, res) =>
  controller.toggleLike(req, res)
);
router.post(
  "/place/:placeId/impression",
  auth.authorize(["CUSTOMER"]),
  (req, res) => controller.createImpression(req, res)
);
router.get(
  "/place/:placeId/likes/count",
  auth.authorize(["ADMIN", "CUSTOMER", "VENUE"]),
  (req, res) => controller.getLikeCount(req, res)
);
router.get("/place/:placeId/impressions/count", (req, res) =>
  controller.getImpressionCount(req, res)
);

export default router;
