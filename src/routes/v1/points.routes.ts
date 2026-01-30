import { PointsController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const pointsController = new PointsController();

router.get(
  "/point/user/:userId",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => pointsController.getUserTotalPoints(req, res),
);

export default router;
