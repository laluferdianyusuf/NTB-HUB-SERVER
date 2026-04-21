import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type GlobalSearchResult = {
  id: string;
  type: "venue" | "event" | "public_place" | "community_event";
  title: string;
  subtitle?: string;
  image?: string;
  rating: number;
  likes: number;
  impressions: number;
  updatedAt: Date;
  startAt?: Date;
  latitude?: number | null;
  longitude?: number | null;
};

type SearchParams = {
  search: string;
  skip?: number;
  take?: number;
  type?: "all" | "venue" | "event" | "public_place" | "community_event";
  sort?: "relevance" | "newest";
};

type SearchResponse = {
  items: GlobalSearchResult[];
  total: number;
};

export class SearchRepository {
  async globalSearch(params: SearchParams): Promise<SearchResponse> {
    const {
      search,
      skip = 0,
      take = 20,
      type = "all",
      sort = "relevance",
    } = params;

    const words = search.trim().length >= 2 ? search.trim().split(/\s+/) : [];

    const buildWordOr = (
      fields: string[],
    ): Record<string, unknown>[] | undefined => {
      if (!words.length) return undefined;

      return words.flatMap((word) =>
        fields.map((field) => ({
          [field]: {
            contains: word,
            mode: "insensitive" as const,
          },
        })),
      );
    };

    const venueWhere = {
      ...(buildWordOr(["name", "city", "description"]) && {
        OR: buildWordOr(["name", "city", "description"]),
      }),
    };

    const eventWhere = {
      isActive: true,
      ...(buildWordOr(["name", "location", "description"]) && {
        OR: buildWordOr(["name", "location", "description"]),
      }),
    };

    const placeWhere = {
      isActive: true,
      ...(buildWordOr(["name", "address", "description"]) && {
        OR: buildWordOr(["name", "address", "description"]),
      }),
    };

    const communityWhere = {
      isPublic: true,
      ...(buildWordOr(["title", "location", "description"]) && {
        OR: buildWordOr(["title", "location", "description"]),
      }),
    };

    const queries: Promise<GlobalSearchResult[]>[] = [];

    if (type === "all" || type === "venue") {
      queries.push(this.searchVenues(venueWhere));
    }

    if (type === "all" || type === "event") {
      queries.push(this.searchEvents(eventWhere));
    }

    if (type === "all" || type === "public_place") {
      queries.push(this.searchPlaces(placeWhere));
    }

    if (type === "all" || type === "community_event") {
      queries.push(this.searchCommunityEvents(communityWhere));
    }

    const chunks = await Promise.all(queries);

    const merged = chunks.flat();

    const sorted = this.sortResults(merged, sort);

    const total = sorted.length;

    const items = sorted.slice(skip, skip + take);

    return {
      items,
      total,
    };
  }

  private async searchVenues(where: any): Promise<GlobalSearchResult[]> {
    const venues = await prisma.venue.findMany({
      where,
      include: {
        bookings: {
          include: {
            review: true,
          },
        },
      },
    });

    return venues.map((v) => {
      const ratings =
        v.bookings
          ?.map((b) => b.review?.rating)
          .filter((r): r is number => typeof r === "number") ?? [];

      const avg =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        id: v.id,
        type: "venue",
        title: v.name,
        subtitle: v.city,
        image: v.image ?? undefined,
        rating: avg,
        likes: v.totalLikes,
        impressions: v.totalViews,
        updatedAt: v.updatedAt,
        latitude: v.latitude,
        longitude: v.longitude,
      };
    });
  }

  private async searchEvents(where: any): Promise<GlobalSearchResult[]> {
    const events = await prisma.event.findMany({
      where,
      include: {
        reviews: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return events.map((e) => {
      const avg =
        e.reviews.length > 0
          ? e.reviews.reduce((a, b) => a + b.rating, 0) / e.reviews.length
          : 0;

      return {
        id: e.id,
        type: "event",
        title: e.name,
        subtitle: e.location,
        image: e.image ?? undefined,
        rating: avg,
        likes: e._count.likes,
        impressions: 0,
        updatedAt: e.updatedAt,
        startAt: e.startAt,
      };
    });
  }

  private async searchPlaces(where: any): Promise<GlobalSearchResult[]> {
    const places = await prisma.publicPlace.findMany({
      where,
      include: {
        reviews: true,
      },
    });

    return places.map((p) => {
      const avg =
        p.reviews.length > 0
          ? p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length
          : 0;

      return {
        id: p.id,
        type: "public_place",
        title: p.name,
        subtitle: p.address,
        image: p.image ?? undefined,
        rating: avg,
        likes: p.totalLikes,
        impressions: p.totalViews,
        updatedAt: p.updatedAt,
        latitude: p.latitude,
        longitude: p.longitude,
      };
    });
  }

  private async searchCommunityEvents(
    where: any,
  ): Promise<GlobalSearchResult[]> {
    const rows = await prisma.communityEvent.findMany({
      where,
      include: {
        collaborations: true,
      },
    });

    return rows.map((c) => ({
      id: c.id,
      type: "community_event",
      title: c.title,
      subtitle: c.location ?? "",
      image: c.image ?? undefined,
      rating: 0,
      likes: 0,
      impressions: c.collaborations.length,
      updatedAt: c.updatedAt,
      startAt: c.startAt,
    }));
  }

  private sortResults(
    items: GlobalSearchResult[],
    sort: "relevance" | "newest",
  ): GlobalSearchResult[] {
    if (sort === "newest") {
      return items.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }

    return items.sort((a, b) => {
      const scoreA =
        a.rating * 4 +
        a.likes * 2 +
        a.impressions * 1 +
        new Date(a.updatedAt).getTime() / 100000000000;

      const scoreB =
        b.rating * 4 +
        b.likes * 2 +
        b.impressions * 1 +
        new Date(b.updatedAt).getTime() / 100000000000;

      return scoreB - scoreA;
    });
  }
}
