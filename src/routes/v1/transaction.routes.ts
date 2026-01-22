import { TransactionController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const transactionController = new TransactionController();

router.post("/transaction/topUp", auth.authorize(["CUSTOMER"]), (req, res) =>
  transactionController.topUp(req, res),
);
router.post(
  "/transaction/topUpQris",
  auth.authorize(["CUSTOMER"]),
  (req, res) => transactionController.topUpQris(req, res),
);
router.post(
  "/transaction/topUpRetail",
  auth.authorize(["CUSTOMER"]),
  (req, res) => transactionController.topUpRetail(req, res),
);
router.post("/transaction/callback", (req, res) =>
  transactionController.midtransCallback(req, res),
);
router.get("/transaction/transactions", auth.authorize(["ADMIN"]), (req, res) =>
  transactionController.findAllTransactions(req, res),
);

router.get(
  "/transaction/transactions/:id",
  auth.authorize(["CUSTOMER", "ADMIN"]),
  (req, res) => transactionController.findAllTransactionsByUserId(req, res),
);
router.get("/transaction-venue", auth.authorize(["VENUE"]), (req, res) =>
  transactionController.findAllTransactionsByVenueId(req, res),
);

export default router;
