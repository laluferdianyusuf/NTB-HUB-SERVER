import { Request, Response } from "express";
import { CommunityMemberRole } from "@prisma/client";
import { CommunityMemberServices } from "services";
import { sendSuccess, sendError } from "helpers/response";

export class CommunityMemberController {
  private service = new CommunityMemberServices();

  addMember = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const { userId, role } = req.body;

      const member = await this.service.addMemberByAdmin(
        communityId,
        userId,
        role ?? CommunityMemberRole.MEMBER,
      );

      return sendSuccess(res, member, "Member added successfully", 201);
    } catch (error: any) {
      if (error.message === "USER_ALREADY_JOINED") {
        return sendError(res, "User already joined this community", 409);
      }

      return sendError(res, "Failed to add member");
    }
  };

  requestToJoinCommunity = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const { userId } = req.body;

      const member = await this.service.requestJoinCommunity(
        communityId,
        userId,
      );

      return sendSuccess(res, member, "Request send", 201);
    } catch (error: any) {
      if (error.message === "USER_ALREADY_JOINED") {
        return sendError(res, "User already joined this community", 409);
      }

      return sendError(res, "Failed to request join");
    }
  };

  removeMember = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;

      await this.service.removeMember(memberId);

      return sendSuccess(res, null, "Member removed successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_REMOVE_MEMBER");
    }
  };
}
