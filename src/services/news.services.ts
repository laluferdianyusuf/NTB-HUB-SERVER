import { NewsStatus } from "@prisma/client";
import { fetchMetaData } from "helpers/meta";
import { NewsRepository } from "repositories";

export class NewsServices {
  constructor(private readonly newsRepo = new NewsRepository()) {}

  async createFromUrl(sourceUrl: string) {
    let title = "";
    let description = "";
    let image: string | null = null;
    let source = "";
    let status: NewsStatus = NewsStatus.FAILED;

    try {
      const meta = await fetchMetaData(sourceUrl);

      title = meta.title ?? "";
      description = meta.description ?? "";
      image = String(meta.image) ?? null;
      source = meta.siteName ?? "";

      status = title ? NewsStatus.AUTO : NewsStatus.MANUAL;
    } catch {
      status = NewsStatus.FAILED;
    }

    const news = this.newsRepo.create({
      sourceUrl,
      title,
      description,
      image,
      source,
      status,
    });

    return news;
  }

  async getAllNews() {
    const news = this.newsRepo.findAllNews();
    if (!news) {
      throw new Error("No news");
    }

    return news;
  }

  async getNewsById(id: string) {
    const news = this.newsRepo.findNewsById(id);
    if (!news) {
      throw new Error("No news found");
    }
    return news;
  }

  async createImpression(data: {
    newsId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.newsRepo.createImpression(data);
  }

  async createComment(payload: {
    newsId: string;
    userId: string;
    content: string;
  }) {
    if (!payload.content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    return this.newsRepo.createComment(payload);
  }

  async getAllCommentsByNews(newsId: string) {
    if (!newsId) {
      throw new Error("News ID is required");
    }

    return this.newsRepo.findAllByNewsId(newsId);
  }
}
