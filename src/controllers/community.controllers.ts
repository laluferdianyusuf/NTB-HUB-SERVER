import { CommunityMemberStatus } from "@prisma/client";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "helpers/response";
import { CommunityService } from "services";

export class CommunityController {
  private service = new CommunityService();

  createCommunity = async (req: Request, res: Response) => {
    try {
      const file = req.file;

      const result = await this.service.createCommunity(req.body, file);

      sendSuccess(res, result, "Community created successfully", 201);
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  };

  findAll = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string;

      const result = await this.service.findAll(
        userId,
        { page, limit },
        search,
      );

      return sendSuccess(res, result, "Communities fetched successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_FETCH_COMMUNITIES");
    }
  };

  findById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const community = await this.service.findById(id);

      return sendSuccess(res, community, "Community fetched successfully");
    } catch (error: any) {
      if (error.message === "COMMUNITY_NOT_FOUND") {
        return sendError(res, "Community not found", 404);
      }

      return sendError(res, "FAILED_TO_FETCH_COMMUNITY");
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updated = await this.service.update(id, {
        name,
        description,
      });

      return sendSuccess(res, updated, "Community updated successfully");
    } catch (error: any) {
      if (error.message === "COMMUNITY_NOT_FOUND") {
        return sendError(res, "Community not found", 404);
      }

      return sendError(res, "FAILED_TO_UPDATE_COMMUNITY");
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await this.service.delete(id);

      return sendSuccess(res, null, "Community deleted successfully");
    } catch (error: any) {
      return sendError(res, "FAILED_TO_DELETE_COMMUNITY");
    }
  };

  getMembers = async (req: Request, res: Response) => {
    try {
      const { id: communityId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string;
      const status = req.query.status as CommunityMemberStatus;

      const members = await this.service.getMembers(
        communityId,
        {
          page,
          limit,
        },
        status,
        search,
      );

      return sendSuccess(
        res,
        members,
        "Community members fetched successfully",
      );
    } catch (error: any) {
      return sendError(res, "FAILED_TO_FETCH_COMMUNITY_MEMBERS");
    }
  };
}
