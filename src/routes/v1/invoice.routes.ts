import { InvoiceController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invoiceController = new InvoiceController();

router.get(
  "/invoice/invoices",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER", "ADMIN"]),
  (req, res) => invoiceController.findAllInvoice(req, res),
);
router.get("/invoice/:bookingId", (req, res) =>
  invoiceController.findInvoiceByBookingId(req, res),
);
router.get(
  "/user/invoices",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => invoiceController.findAllInvoiceByUserId(req, res),
);
router.get(
  "/venue/invoices",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => invoiceController.findAllInvoiceByVenueId(req, res),
);
router.get(
  "/venue/paid-invoices/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["VENUE_OWNER"]),
  (req, res) => invoiceController.findAllPaidInvoiceByVenueId(req, res),
);

export default router;
