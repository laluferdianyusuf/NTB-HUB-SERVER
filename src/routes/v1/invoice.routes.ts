import { InvoiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invoiceController = new InvoiceController();

router.get("/invoice/invoices", auth.authenticate.bind(auth), (req, res) =>
  invoiceController.findAllInvoice(req, res)
);
router.get("/invoice/:bookingId", (req, res) =>
  invoiceController.findInvoiceByBookingId(req, res)
);
router.get("/user/invoices", auth.authenticate.bind(auth), (req, res) =>
  invoiceController.findAllInvoiceByUserId(req, res)
);
router.get("/venue/invoices", auth.venueAuth.bind(auth), (req, res) =>
  invoiceController.findAllInvoiceByVenueId(req, res)
);

export default router;
