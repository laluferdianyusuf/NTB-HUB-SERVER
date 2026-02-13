import { heartbeat, listOnline } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
const auth = new AuthMiddlewares();

const router = Router();

router.post("/heartbeat", auth.authenticate, (req, res) => heartbeat(req, res));
router.get("/online", auth.authenticate, (req, res) => listOnline(req, res));

export default router;
