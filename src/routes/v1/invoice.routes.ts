import { InvoiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invoiceController = new InvoiceController();

router.get("/invoice/invoices", auth.authenticate, (req, res) =>
  invoiceController.findAllInvoice(req, res),
);

export default router;
