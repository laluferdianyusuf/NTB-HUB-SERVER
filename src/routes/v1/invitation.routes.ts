import { InvitationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invitationController = new InvitationController();

router.post(
  "/venue/invitation",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => invitationController.generateInvitationKey(req, res)
);
router.get("/venue/invitations", (req, res) =>
  invitationController.findAllInvitationKeys(req, res)
);
router.get("/venue/invitation/:key", (req, res) =>
  invitationController.findInvitationKey(req, res)
);
router.get("/venue/:venueId/invitations", (req, res) =>
  invitationController.findInvitationKeyByVenueId(req, res)
);

export default router;
