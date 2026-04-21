import { SearchController } from "controllers";
import { Router } from "express";

const router = Router();
const controller = new SearchController();

router.get("/global", (req, res) => controller.globalSearch(req, res));

export default router;
