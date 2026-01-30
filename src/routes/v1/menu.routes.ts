import { MenuControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const menuController = new MenuControllers();

router.get(
  "/all",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER"]),
  (req, res) => menuController.getAllMenus(req, res),
);
router.post(
  "/create/menu",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  upload.single("image"),
  (req, res) => menuController.createMenu(req, res),
);
router.get(
  "/menu/venues/:venueId",
  auth.authenticate,
  auth.authorizeGlobalRole(["CUSTOMER", "VENUE_OWNER"]),
  (req, res) => menuController.getMenuByVenueId(req, res),
);
router.get("/menu/:id", (req, res) => menuController.getMenuById(req, res));
router.put(
  "/menu/:id",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  upload.single("image"),
  (req, res) => menuController.updateMenu(req, res),
);
router.delete(
  "/menu/:id",
  auth.authenticate,
  auth.authorizeVenueRole(["VENUE_OWNER"]),
  (req, res) => menuController.deleteMenu(req, res),
);

export default router;
