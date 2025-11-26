import { MenuControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const menuController = new MenuControllers();

router.post(
  "/venues/:venueId/menus",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => menuController.createMenu(req, res)
);
router.get("/venues/:venueId/menus", auth.authenticate.bind(auth), (req, res) =>
  menuController.getMenuByVenueId(req, res)
);
router.get("/:id", auth.venueAuth.bind(auth), (req, res) =>
  menuController.getMenuById(req, res)
);
router.put(
  "/:id",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => menuController.updateMenu(req, res)
);
router.delete("/:id", auth.venueAuth.bind(auth), (req, res) =>
  menuController.deleteMenu(req, res)
);

export default router;
