import { TableControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const tableController = new TableControllers();

router.post(
  "/table/floors/:floorId",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.createTable(req, res)
);
router.get("/table/floors/:floorId", (req, res) =>
  tableController.getTableByFloorId(req, res)
);
router.get("/table/:id", (req, res) => tableController.getTableById(req, res));
router.put(
  "/table/update/:id",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.updateTable(req, res)
);
router.delete("/table/delete/:id", auth.venueAuth.bind(auth), (req, res) =>
  tableController.deleteTable(req, res)
);

export default router;
