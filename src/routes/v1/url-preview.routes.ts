import { getLinkPreview } from "controllers";
import { Router } from "express";

const router = Router();

router.post("/link-preview", (req, res) => getLinkPreview(req, res));

export default router;
