import { CommunityMemberController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const controller = new CommunityMemberController();
const auth = new AuthMiddlewares();

router.post("/add/:communityId", auth.authenticate, (req, res) =>
  controller.addMember(req, res),
);

router.post("/request/:communityId", auth.authenticate, (req, res) =>
  controller.requestToJoinCommunity(req, res),
);

router.patch("/approve/:memberId", auth.authenticate, (req, res) =>
  controller.approveMember(req, res),
);

router.delete("/reject/:memberId", auth.authenticate, (req, res) =>
  controller.rejectMember(req, res),
);

export default router;
