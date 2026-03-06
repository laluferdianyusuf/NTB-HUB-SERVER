import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { CommunityEventTicketTypeService } from "../services";

export class CommunityEventTicketTypeController {
  private ticketTypeService = new CommunityEventTicketTypeService();

  createTicketType = async (req: Request, res: Response) => {
    try {
      const actorId = req.user?.id as string; // assume auth middleware injects user
      const { communityEventId } = req.params;

      const { name, price, quota, description } = req.body;

      if (!actorId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await this.ticketTypeService.createTicketType({
        actorId,
        communityEventId,
        name,
        price,
        quota,
        description,
      });

      sendSuccess(res, result, "Create success", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };

  findAllTicketTypes = async (req: Request, res: Response) => {
    try {
      const actorId = req.user?.id; // optional (public allowed)
      const { communityEventId } = req.params;

      const { includeInactive, page, limit, sortBy, sortOrder } = req.query;

      const result = await this.ticketTypeService.findAllTicketTypes({
        actorId,
        communityEventId,
        includeInactive: includeInactive === "true",
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      sendSuccess(res, result, "Tickets retrieved");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  };
}
