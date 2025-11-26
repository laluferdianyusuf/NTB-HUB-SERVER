import { InvoiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invoiceController = new InvoiceController();

router.get("/invoices", auth.authenticate.bind(auth), (req, res) =>
  invoiceController.findAllInvoice(req, res)
);
router.get("/:bookingId/invoices", auth.authenticate.bind(auth), (req, res) =>
  invoiceController.findInvoiceByBookingId(req, res)
);

export default router;
