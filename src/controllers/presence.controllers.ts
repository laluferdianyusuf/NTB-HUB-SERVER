import { Request, Response } from "express";
import { PresenceService } from "services";

const service = new PresenceService();

export const heartbeat = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { context, contextId } = req.body;

  await service.heartbeat(String(userId), context, contextId);
  res.json({ success: true });
};

export const listOnline = async (req: Request, res: Response) => {
  const { context, contextId } = req.query;
  const users = await service.listOnline(
    context as string,
    contextId as string,
  );

  res.json(users);
};
