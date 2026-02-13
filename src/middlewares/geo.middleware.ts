import { Request, Response, NextFunction } from "express";
import { getDistanceMeter } from "helpers/geo";

export const geoFenceMiddleware =
  (taskGetter: (req: Request) => Promise<any>) =>
  async (req: any, res: Response, next: NextFunction) => {
    const { latitude, longitude, accuracy, timestamp } = req.body;

    if (!latitude || !longitude || accuracy == null) {
      return res.status(400).json({ message: "Location required" });
    }

    if (accuracy > 50) {
      return res.status(403).json({ message: "GPS tidak akurat" });
    }

    if (timestamp && Math.abs(Date.now() - timestamp) > 30_000) {
      return res.status(403).json({ message: "Timestamp invalid" });
    }

    const task = await taskGetter(req);
    if (!task.latitude || !task.longitude || !task.radius) {
      return res.status(400).json({ message: "Task tidak punya lokasi" });
    }

    const distance = getDistanceMeter(
      latitude,
      longitude,
      task.latitude,
      task.longitude,
    );

    if (distance > task.radius) {
      return res.status(403).json({ message: "Di luar area task" });
    }

    req._antiCheat = {
      ...req._antiCheat,
      geoPassed: true,
      distance,
    };

    next();
  };
