import { InvitationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const invitationController = new InvitationController();

router.post(
  "/venue/create-invitation",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => invitationController.generateInvitationKey(req, res),
);

router.post(
  "/event/create-invitation",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => invitationController.generateEventInvitationKey(req, res),
);

router.post(
  "/venue/claim-invitation",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => invitationController.claimInvitation(req, res),
);

router.post(
  "/event/claim-invitation",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => invitationController.claimEventInvitation(req, res),
);

export default router;
