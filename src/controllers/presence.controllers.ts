import { Request, Response } from "express";
import { PresenceService } from "services";

const service = new PresenceService();

export const heartbeat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { context, contextId, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!context || latitude == null || longitude == null) {
      return res.status(400).json({
        message: "context, latitude, and longitude are required",
      });
    }

    await service.heartbeat(
      String(userId),
      context,
      Number(latitude),
      Number(longitude),
      contextId,
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listOnline = async (req: Request, res: Response) => {
  try {
    const { context, contextId } = req.query;

    if (!context) {
      return res.status(400).json({ message: "context is required" });
    }

    const users = await service.listOnline(
      context as string,
      contextId as string | undefined,
    );

    return res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("ListOnline error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const nearbyOnline = async (req: Request, res: Response) => {
  try {
    const { context, contextId, latitude, longitude, radius } = req.query;

    if (!context || !latitude || !longitude) {
      return res.status(400).json({
        message: "context, latitude and longitude are required",
      });
    }

    const users = await service.getNearbyOnlineUsers(
      Number(latitude),
      Number(longitude),
      Number(radius ?? 5),
      context as string,
      contextId as string | undefined,
    );

    return res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("NearbyOnline error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
