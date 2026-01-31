import { TransactionController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const transactionController = new TransactionController();

router.post(
  "/transaction/topUp",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => transactionController.topUp(req, res),
);
router.post(
  "/transaction/topUpQris",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => transactionController.topUpQris(req, res),
);
router.post(
  "/transaction/topUpRetail",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => transactionController.topUpRetail(req, res),
);
router.post("/transaction/callback", (req, res) =>
  transactionController.midtransCallback(req, res),
);
router.get(
  "/transaction/transactions",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => transactionController.findAllTransactions(req, res),
);

router.get(
  "/transaction/transactions/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER", "ADMIN"]),
  (req, res) => transactionController.getTransactionsByUser(req, res),
);

router.get(
  "/transaction-venue/:venueId",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => transactionController.findAllTransactionsByVenueId(req, res),
);

router.get(
  "/transaction-detail/:id",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER", "ADMIN", "CUSTOMER"]),
  (req, res) => transactionController.findTransactionsById(req, res),
);

export default router;
