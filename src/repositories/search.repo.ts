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
};

export class SearchRepository {
  async globalSearch(params: {
    search: string;
    skip?: number;
    take?: number;
  }): Promise<GlobalSearchResult[]> {
    const { search, skip = 0, take = 20 } = params;

    const words = search.trim().length >= 2 ? search.trim().split(/\s+/) : [];

    const venueWhere = {
      //   isActive: true,
      ...(words.length > 0 && {
        OR: words.flatMap((word) => [
          { name: { contains: word, mode: "insensitive" as const } },
          { city: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } },
        ]),
      }),
    };

    const eventWhere = {
      isActive: true,
      ...(words.length > 0 && {
        OR: words.flatMap((word) => [
          { name: { contains: word, mode: "insensitive" as const } },
          { location: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } },
        ]),
      }),
    };

    const communityWhere = {
      isPublic: true,
      ...(words.length > 0 && {
        OR: words.flatMap((word) => [
          { title: { contains: word, mode: "insensitive" as const } },
          { location: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } },
        ]),
      }),
    };

    const publicPlaceWhere = {
      isActive: true,
      ...(words.length > 0 && {
        OR: words.flatMap((word) => [
          { name: { contains: word, mode: "insensitive" as const } },
          { address: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } },
        ]),
      }),
    };

    const [venues, events, communityEvents, publicPlaces] = await Promise.all([
      prisma.venue.findMany({
        where: venueWhere,
        include: {
          _count: { select: { likes: true, impressions: true } },
          bookings: { include: { review: true } },
        },
        skip,
        take,
      }),
      prisma.event.findMany({
        where: eventWhere,
        include: { _count: { select: { likes: true } }, reviews: true },
        skip,
        take,
      }),
      prisma.communityEvent.findMany({
        where: communityWhere,
        include: { collaborations: true },
        skip,
        take,
      }),
      prisma.publicPlace.findMany({
        where: publicPlaceWhere,
        include: {
          _count: { select: { likes: true, impressions: true } },
          reviews: true,
        },
        skip,
        take,
      }),
    ]);

    const venueResults: GlobalSearchResult[] = venues.map((v) => {
      const ratings =
        v.bookings
          ?.map((b) => b.review?.rating)
          .filter((r): r is number => typeof r === "number") ?? [];
      const avgRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      return {
        id: v.id,
        type: "venue",
        title: v.name,
        subtitle: v.city,
        image: v.image ?? undefined,
        rating: avgRating,
        likes: v.totalLikes,
        impressions: v.totalViews,
        latitude: v.latitude,
        longitude: v.longitude,
        updatedAt: v.updatedAt,
      };
    });

    const eventResults: GlobalSearchResult[] = events.map((e) => {
      const avgRating = e.reviews.length
        ? e.reviews.reduce((a, b) => a + b.rating, 0) / e.reviews.length
        : 0;
      return {
        id: e.id,
        type: "event",
        title: e.name,
        subtitle: e.location,
        image: e.image ?? undefined,
        rating: avgRating,
        likes: e._count.likes,
        impressions: 0,
        updatedAt: e.updatedAt,
      };
    });

    const communityResults: GlobalSearchResult[] = communityEvents.map((c) => ({
      id: c.id,
      type: "community_event",
      title: c.title,
      subtitle: c.location ?? "",
      image: c.image ?? undefined,
      rating: 0, // tidak ada rating
      likes: 0,
      impressions: c.collaborations.length,
      updatedAt: c.updatedAt,
      startAt: c.startAt,
    }));

    const placeResults: GlobalSearchResult[] = publicPlaces.map((p) => {
      const avgRating = p.reviews.length
        ? p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length
        : 0;
      return {
        id: p.id,
        type: "public_place",
        title: p.name,
        subtitle: p.address,
        image: p.image ?? undefined,
        rating: avgRating,
        likes: p.totalLikes,
        impressions: p.totalViews,
        latitude: p.latitude,
        longitude: p.longitude,
        updatedAt: p.updatedAt,
      };
    });

    const merged = [
      ...venueResults,
      ...eventResults,
      ...communityResults,
      ...placeResults,
    ];

    merged.sort((a, b) => {
      const scoreA =
        a.rating * 0.4 +
        a.likes * 0.3 +
        a.impressions * 0.2 +
        new Date(a.updatedAt).getTime() * 0.000000001;
      const scoreB =
        b.rating * 0.4 +
        b.likes * 0.3 +
        b.impressions * 0.2 +
        new Date(b.updatedAt).getTime() * 0.000000001;
      return scoreB - scoreA;
    });

    return merged.slice(0, take);
  }
}
