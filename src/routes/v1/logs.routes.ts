import { LogController } from "controllers";
import { Router } from "express";

const router = Router();
const logsController = new LogController();

router.get("/log/logs", (req, res) => logsController.getAllLogs(req, res));
router.get("/log/user/:userId", (req, res) =>
  logsController.findLogByUserId(req, res)
);

export default router;
