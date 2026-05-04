import { WellKnownController } from "controllers";
import { Router } from "express";

const router = Router();

router.get("/.well-known/assetlinks.json", WellKnownController.assetLinks);
router.get(
  "/.well-known/apple-app-site-association",
  WellKnownController.appleAppSite,
);

export default router;
