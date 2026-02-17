import { Router } from "express";
import { SearchController } from "controllers";

const router = Router();
const controller = new SearchController();

router.get("/global", controller.globalSearch.bind(controller));

export default router;
