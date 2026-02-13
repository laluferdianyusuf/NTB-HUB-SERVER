import { Request, Response } from "express";
import { CommunityReactionServices } from "services";
import { sendSuccess, sendError } from "helpers/response";

export class CommunityReactionController {
  private service = new CommunityReactionServices();

  getReactions = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const reactions = await this.service.getReactions(postId);

      return sendSuccess(res, reactions, "Reactions fetched successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_FETCH_REACTIONS");
    }
  };

  addReaction = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { type } = req.body;
      const userId = req.user?.id;

      const reaction = await this.service.addReaction(
        postId,
        String(userId),
        type,
      );

      return sendSuccess(res, reaction, "Reaction added successfully", 201);
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_ADD_REACTION");
    }
  };

  removeReaction = async (req: Request, res: Response) => {
    try {
      const { reactionId } = req.params;

      await this.service.removeReaction(reactionId);

      return sendSuccess(res, null, "Reaction removed successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_REMOVE_REACTION");
    }
  };
}
