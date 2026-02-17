import { News, NewsComment, NewsStatus, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

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

  async createImpression({
    newsId,
    userId,
    ipAddress,
    userAgent,
  }: {
    newsId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const since = dayjs().subtract(1, "hour").toDate();

    const existing = await prisma.newsImpression.findFirst({
      where: {
        newsId,
        OR: [
          userId ? { userId } : undefined,
          ipAddress ? { ipAddress } : undefined,
        ].filter(Boolean) as any[],
        createdAt: { gte: since },
      },
    });

    if (existing) return;

    return await prisma.$transaction([
      prisma.newsImpression.create({
        data: {
          newsId,
          userId,
          ipAddress,
          userAgent,
        },
      }),
      prisma.news.update({
        where: { id: newsId },
        data: { totalViews: { increment: 1 } },
      }),
    ]);
  }

  async createComment(data: {
    newsId: string;
    userId: string;
    content: string;
  }): Promise<NewsComment> {
    return prisma.newsComment.create({
      data,
    });
  }

  async findAllByNewsId(newsId: string): Promise<NewsComment[]> {
    return prisma.newsComment.findMany({
      where: { newsId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });
  }
}
