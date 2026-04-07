import { LedgerController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new LedgerController();
const auth = new AuthMiddlewares();

router.get("/account/:accountId", auth.authenticate, (req, res) =>
  controller.getHistory(req, res),
);

router.get("/account/:accountId/balance", auth.authenticate, (req, res) =>
  controller.getBalances(req, res),
);

router.get("/account/:accountId/balance", auth.authenticate, (req, res) =>
  controller.getBalances(req, res),
);

router.get("/balance", auth.authenticate, (req, res) =>
  controller.getBalance(req, res),
);

router.get("/user-transactions", auth.authenticate, (req, res) =>
  controller.getUserTransactions(req, res),
);

router.get("/venue-transactions/:venueId", auth.authenticate, (req, res) =>
  controller.getVenueTransactions(req, res),
);

router.get(
  "/community-transactions/:communityId",
  auth.authenticate,
  (req, res) => controller.getCommunityTransactions(req, res),
);

router.get("/event-transactions/:eventId", auth.authenticate, (req, res) =>
  controller.getEventTransactions(req, res),
);

router.get("/courier-transactions/:courierId", auth.authenticate, (req, res) =>
  controller.getCourierTransactions(req, res),
);

export default router;
