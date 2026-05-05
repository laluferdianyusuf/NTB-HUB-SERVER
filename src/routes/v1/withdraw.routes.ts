import { WithdrawController } from "controllers";
import express from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = express.Router();
const controller = new WithdrawController();
const auth = new AuthMiddlewares();

// user
router.post("/request/:accountId", auth.authenticate, (req, res) =>
  controller.request(req, res),
);

router.get("/by-account/:accountId", auth.authenticate, (req, res) =>
  controller.listByAccount(req, res),
);

router.get("/venue/:venueId", auth.authenticate, (req, res) =>
  controller.byVenue(req, res),
);

// admin
router.get("/", auth.authenticate, (req, res) => controller.list(req, res));

router.post("/:id/approve", auth.authenticate, (req, res) =>
  controller.approve(req, res),
);

router.post("/:id/processing", auth.authenticate, (req, res) =>
  controller.processing(req, res),
);

router.post("/:id/paid", auth.authenticate, (req, res) =>
  controller.paid(req, res),
);

router.post("/:id/reject", auth.authenticate, (req, res) =>
  controller.reject(req, res),
);

export default router;
