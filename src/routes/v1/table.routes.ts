import { TableControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";
import { upload } from "middlewares/upload";

const router = Router();
const auth = new AuthMiddlewares();
const tableController = new TableControllers();

router.post(
  "/table",
  auth.authorize(["VENUE"]),
  upload.single("image"),
  (req, res) => tableController.createTable(req, res)
);
router.get("/table/floors/:floorId/venue/:venueId", (req, res) =>
  tableController.getTableByFloorId(req, res)
);
router.get("/table/:id", (req, res) => tableController.getTableById(req, res));
router.get("/tables/:venueId", auth.authorize(["VENUE"]), (req, res) =>
  tableController.getTableByVenueId(req, res)
);
router.put(
  "/table/update/:id",
  auth.authorize(["VENUE"]),
  upload.single("image"),
  (req, res) => tableController.updateTable(req, res)
);
router.delete("/table/delete/:id", auth.authorize(["VENUE"]), (req, res) =>
  tableController.deleteTable(req, res)
);
router.get("/table/:id/status", (req, res) =>
  tableController.getTableStatus(req, res)
);
router.get("/available/tables", (req, res) =>
  tableController.getAvailableTables(req, res)
);

export default router;
