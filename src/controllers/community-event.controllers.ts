import { z } from "zod";

import { Response, Request } from "express";
import { CommunityEventService } from "services";
import { sendError, sendSuccess } from "helpers/response";

const service = new CommunityEventService();

const collabSchema = z.object({
  eventId: z.string().uuid(),
  communityId: z.string().uuid(),
});

export class CommunityEventController {
  create = async (req: Request, res: Response) => {
    console.log(req.body);

    try {
      const {
        title,
        description,
        startAt,
        endAt,
        type,
        location,
        collaborations,
      } = req.body;
      const { communityId } = req.params;
      const createdById = String(req.user?.id) as string;
      const event = await service.createEvent(
        communityId,
        createdById,
        {
          title,
          description,
          startAt: new Date(startAt),
          endAt: endAt ? new Date(endAt) : undefined,
          type,
          location,
          collaborations: collaborations ? JSON.parse(collaborations) : [],
        },
        req.file as Express.Multer.File,
      );
      console.log(communityId);

      return sendSuccess(res, event, "Event created", 201);
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_CREATE_EVENT");
    }
  };

  addCollaboration = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const body = collabSchema.parse(req.body);

      const result = await service.addCollaboration(eventId, body.communityId);

      return sendSuccess(res, result, "Collaboration created", 201);
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_CREATE_COLLABORATION");
    }
  };

  listByCommunity = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const events = await service.listByCommunity(communityId);
      return sendSuccess(res, events, "Events retrieved");
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_FETCH_EVENT");
    }
  };

  detail = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const data = await service.getEventDetail(eventId);
      return sendSuccess(res, data, "Detail event");
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_CREATE_TWIBBON");
    }
  };
}
