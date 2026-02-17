import { Request, Response } from "express";
import { sendError, sendSuccess } from "helpers/response";
import { NewsServices } from "services";

const newsService = new NewsServices();

export class NewsController {
  async createNews(req: Request, res: Response) {
    try {
      const { sourceUrl } = req.body;

      if (!sourceUrl) {
        return res.status(400).json({
          status: false,
          message: "source url is required",
        });
      }

      const news = await newsService.createFromUrl(sourceUrl);

      return res.status(201).json({
        status: true,
        message: "News successfully saved",
        data: news,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async findAllNews(req: Request, res: Response) {
    try {
      const news = await newsService.getAllNews();
      res.status(200).json({
        status: true,
        message: "News retrieved successful",
        data: news,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async findNewsById(req: Request, res: Response) {
    try {
      const news = await newsService.getNewsById(req.params.id);

      if (!news) {
        res.status(404).json({
          status: false,
          message: "News not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "News retrieved successful",
        data: news,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async createImpression(req: Request, res: Response) {
    try {
      const newsId = req.params.newsId;
      const userId = req.user?.id as string;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      await newsService.createImpression({
        newsId,
        userId,
        ipAddress,
        userAgent,
      });

      sendSuccess(res, "News visited");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async createComment(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { newsId, content } = req.body;

      const comment = await newsService.createComment({
        newsId,
        userId,
        content,
      });

      sendSuccess(res, comment, "News comment created", 201);
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal Server Error");
    }
  }

  async getAllComments(req: Request, res: Response) {
    try {
      const { newsId } = req.params;

      const comments = await newsService.getAllCommentsByNews(newsId);

      sendSuccess(res, comments, "News comment retrieved");
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal Server Error");
    }
  }
}
