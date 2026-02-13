import { Router } from "express";
import { MapsController } from "../../controllers";

const router = Router();

router.get("/places/autocomplete", MapsController.autocomplete);
router.get("/places/details/:placeId", MapsController.placeDetails);
router.get("/directions", MapsController.directions);

export default router;
