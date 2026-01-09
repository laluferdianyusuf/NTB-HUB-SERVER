import { FloorControllers } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const router = Router();
const auth = new AuthMiddlewares();
const floorController = new FloorControllers();

router.post("/floor/venues/:venueId", auth.authorize(["VENUE"]), (req, res) =>
  floorController.createFloor(req, res)
);
router.get("/floor/venues/:venueId", (req, res) =>
  floorController.getFloorByVenueId(req, res)
);
router.get("/floor/:id", (req, res) => floorController.getFloorById(req, res));
router.put("/floor/update/:id", auth.authorize(["VENUE"]), (req, res) =>
  floorController.updateFloor(req, res)
);
router.delete("/floor/delete/:id", auth.authorize(["VENUE"]), (req, res) =>
  floorController.deleteFloor(req, res)
);

export default router;
