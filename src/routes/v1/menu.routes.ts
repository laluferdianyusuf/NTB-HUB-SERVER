import { MenuControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const menuController = new MenuControllers();

router.get("/all", auth.authorize(["CUSTOMER"]), (req, res) =>
  menuController.getAllMenus(req, res)
);
router.post(
  "/menu/venues",
  auth.authorize(["VENUE"]),
  upload.single("image"),
  (req, res) => menuController.createMenu(req, res)
);
router.get("/menu/venues/:venueId", (req, res) =>
  menuController.getMenuByVenueId(req, res)
);
router.get("/menu/:id", (req, res) => menuController.getMenuById(req, res));
router.put(
  "/menu/:id",
  auth.authorize(["VENUE"]),
  upload.single("image"),
  (req, res) => menuController.updateMenu(req, res)
);
router.delete("/menu/:id", auth.authorize(["VENUE"]), (req, res) =>
  menuController.deleteMenu(req, res)
);

export default router;
