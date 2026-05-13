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

      sendSuccess(res, member, "Member added successfully", 201);
    } catch (error: any) {
      sendError(res, "Failed to add member");
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

      sendSuccess(res, member, "Request send", 201);
    } catch (error: any) {
      sendError(res, "Failed to request join");
    }
  };

  approveMember = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const adminId = req.user?.id;

      const result = await this.service.approveMember(
        memberId,
        String(adminId),
      );

      sendSuccess(res, result, "Member approved successfully");
    } catch (error: any) {
      sendError(res, error.message || "FAILED_TO_APPROVE_MEMBER");
    }
  };

  rejectMember = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const adminId = req.user?.id;

      const result = await this.service.rejectMember(memberId, String(adminId));

      sendSuccess(res, result, "Member removed successfully");
    } catch (error: any) {
      sendError(res, error.message || "FAILED_TO_REMOVE_MEMBER");
    }
  };
}
