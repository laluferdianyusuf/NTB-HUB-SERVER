import { TransactionController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const transactionController = new TransactionController();

router.post("/transaction/topUp", auth.authenticate.bind(auth), (req, res) =>
  transactionController.topUp(req, res)
);
router.post("/transaction/callback", (req, res) =>
  transactionController.midtransCallback(req, res)
);
router.get(
  "/transaction/transactions",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => transactionController.findAllTransactions(req, res)
);

export default router;
