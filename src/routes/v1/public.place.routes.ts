import { Router } from "express";
import { PublicPlaceController } from "controllers";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const controller = new PublicPlaceController();
const auth = new AuthMiddlewares();

// public
router.get("/list-places", (req, res) => controller.list(req, res));
router.get("/detail-place/:id", (req, res) => controller.detail(req, res));

// admin only
router.post(
  "/create-place",
  auth.authorize(["ADMIN"]),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  (req, res) => controller.create(req, res),
);
router.put("/update-place/:id", auth.authorize(["ADMIN"]), (req, res) =>
  controller.update(req, res),
);
router.delete("/delete-place/:id", auth.authorize(["ADMIN"]), (req, res) =>
  controller.deactivate(req, res),
);

// interactions with place
router.post("/place/:placeId/like", auth.authorize(["CUSTOMER"]), (req, res) =>
  controller.toggleLike(req, res),
);
router.post(
  "/place/:placeId/impression",
  auth.authorize(["CUSTOMER"]),
  (req, res) => controller.createImpression(req, res),
);
router.get(
  "/place/:placeId/likes/count",
  auth.authorize(["ADMIN", "CUSTOMER", "VENUE"]),
  (req, res) => controller.getLikeCount(req, res),
);
router.get("/place/:placeId/impressions/count", (req, res) =>
  controller.getImpressionCount(req, res),
);

export default router;
