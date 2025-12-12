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
router.get("/table/floors/:floorId/venue/:venueId", (req, res) =>
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
router.get("/table/:id/status", (req, res) =>
  tableController.getTableStatus(req, res)
);
router.get("/table/available", (req, res) =>
  tableController.getAvailableTables(req, res)
);

export default router;
