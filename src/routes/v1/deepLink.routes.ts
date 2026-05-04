import { DeepLinkController } from "controllers";
import { Router } from "express";

const router = Router();

router.get("/:type/:id", DeepLinkController.handle);

export default router;
