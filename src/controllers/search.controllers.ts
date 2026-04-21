import { Request, Response } from "express";
import { SearchRepository } from "repositories";
import { SearchService } from "services";

const searchService = new SearchService(new SearchRepository());

export class SearchController {
  async globalSearch(req: Request, res: Response): Promise<Response> {
    try {
      const result = await searchService.globalSearch({
        search: req.query.search as string,
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        type: req.query.type as any,
        sort: req.query.sort as any,
      });

      return res.status(200).json({
        success: true,
        message: "Global search success",
        ...result,
      });
    } catch (error: any) {
      console.error("Global Search Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
