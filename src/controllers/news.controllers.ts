import { Request, Response } from "express";
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
}
