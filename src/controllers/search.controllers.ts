import { Request, Response } from "express";
import { SearchRepository } from "repositories";
import { SearchService } from "services";

const searchService = new SearchService(new SearchRepository());

export class SearchController {
  async globalSearch(req: Request, res: Response): Promise<Response> {
    try {
      const { q, page, limit } = req.query;
      console.log("query", q);

      const result = await searchService.globalSearch({
        search: String(q ?? ""),
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
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
