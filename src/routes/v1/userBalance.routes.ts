import { UserBalanceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const userBalanceController = new UserBalanceController();

router.get("/balance/user/:userId", auth.authorize(["CUSTOMER"]), (req, res) =>
  userBalanceController.getUserBalance(req, res)
);

export default router;
