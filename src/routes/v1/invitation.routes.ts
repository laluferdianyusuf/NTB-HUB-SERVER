import { InvitationController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const invitationController = new InvitationController();

router.post(
  "/invitation/create",
  auth.authenticate.bind(auth),
  auth.isAdmin.bind(auth),
  (req, res) => invitationController.generateInvitationKey(req, res)
);
router.get("/invitation/invitations", (req, res) =>
  invitationController.findAllInvitationKeys(req, res)
);
router.get("/invitation/:key", (req, res) =>
  invitationController.findInvitationKey(req, res)
);
router.get("/invitation/:venueId", (req, res) =>
  invitationController.findInvitationKeyByVenueId(req, res)
);

export default router;
