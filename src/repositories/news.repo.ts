import { News, NewsStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class NewsRepository {
  create(data: {
    sourceUrl: string;
    title: string;
    description: string;
    image?: string | null;
    source: string;
    status: NewsStatus;
  }): Promise<News> {
    return prisma.news.create({
      data,
    });
  }

  findNewsById(id: string): Promise<News | null> {
    return prisma.news.findUnique({
      where: { id },
    });
  }

  findAllNews(): Promise<News[]> {
    return prisma.news.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
