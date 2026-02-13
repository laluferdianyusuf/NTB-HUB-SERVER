import { Request, Response } from "express";
import { CommunityPostServices } from "services";
import { sendSuccess, sendError } from "helpers/response";

export class CommunityPostController {
  private service = new CommunityPostServices();

  getPosts = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string;

      const posts = await this.service.getPosts(
        communityId,
        { page, limit },
        search,
      );

      return sendSuccess(res, posts, "Posts fetched successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_FETCH_POSTS");
    }
  };

  addPost = async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const { content, link } = req.body;
      const file = req.file;
      const adminId = req.user?.id as string;

      const post = await this.service.addPost(
        communityId,
        String(adminId),
        content,
        link,
        file,
      );

      return sendSuccess(res, post, "Post created successfully", 201);
    } catch (error: any) {
      console.log(error);

      return sendError(res, error.message || "FAILED_TO_CREATE_POST");
    }
  };

  updatePost = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { content, link } = req.body;

      const post = await this.service.updatePost(postId, { content, link });

      return sendSuccess(res, post, "Post updated successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_UPDATE_POST");
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      await this.service.deletePost(postId);

      return sendSuccess(res, null, "Post deleted successfully");
    } catch (error: any) {
      return sendError(res, error.message || "FAILED_TO_DELETE_POST");
    }
  };
}
