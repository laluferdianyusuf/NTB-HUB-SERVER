import { TableControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const tableController = new TableControllers();

router.post(
  "/floors/:floorId/tables",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.createTable(req, res)
);
router.get(
  "/floors/:floorId/tables",
  auth.authenticate.bind(auth),
  (req, res) => tableController.getTableByFloorId(req, res)
);
router.get("get/table/:id", (req, res) =>
  tableController.getTableById(req, res)
);
router.put(
  "/update/table/:id",
  auth.venueAuth.bind(auth),
  upload.single("image"),
  (req, res) => tableController.updateTable(req, res)
);
router.delete("delete/table/:id", auth.venueAuth.bind(auth), (req, res) =>
  tableController.deleteTable(req, res)
);

export default router;
