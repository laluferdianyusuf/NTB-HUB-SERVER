import { LogController } from "controllers";
import { Router } from "express";

const router = Router();
const logsController = new LogController();

router.get("/logs", (req, res) => logsController.getAllLogs(req, res));
router.get("/logs/user/:userId", (req, res) =>
  logsController.findLogByUserId(req, res)
);

export default router;
