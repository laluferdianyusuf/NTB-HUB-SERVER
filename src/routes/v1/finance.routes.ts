import { FinanceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();

const auth = new AuthMiddlewares();
const financeController = new FinanceController();

router.get("/owner/dashboard/:venueId", auth.authenticate, (req, res) =>
  financeController.dashboard(req, res),
);

router.get("/owner/summary/:venueId", auth.authenticate, (req, res) =>
  financeController.summary(req, res),
);

router.get("/owner/transactions/:venueId", auth.authenticate, (req, res) =>
  financeController.transactions(req, res),
);

router.get("/owner/withdrawals/:venueId", auth.authenticate, (req, res) =>
  financeController.withdrawals(req, res),
);

export default router;
