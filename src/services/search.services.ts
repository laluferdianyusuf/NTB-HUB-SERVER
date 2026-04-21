import { GlobalSearchResult, SearchRepository } from "repositories";

type SearchParams = {
  search?: string;
  page?: number;
  limit?: number;
  type?: "all" | "venue" | "event" | "public_place" | "community_event";
  sort?: "relevance" | "newest";
};

type SearchResponse = {
  data: {
    venues: GlobalSearchResult[];
    events: GlobalSearchResult[];
    publicPlaces: GlobalSearchResult[];
    communityEvents: GlobalSearchResult[];
  };
  meta: {
    search: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    type: string;
    sort: string;
  };
};

export class SearchService {
  constructor(private searchRepo: SearchRepository) {}

  async globalSearch(params: SearchParams): Promise<SearchResponse> {
    const search = params.search?.trim() ?? "";

    const page =
      params.page && Number(params.page) > 0 ? Number(params.page) : 1;

    const limit =
      params.limit && Number(params.limit) > 0 && Number(params.limit) <= 50
        ? Number(params.limit)
        : 20;

    const skip = (page - 1) * limit;

    const type = params.type ?? "all";
    const sort = params.sort ?? "relevance";

    const { items, total } = await this.searchRepo.globalSearch({
      search,
      skip,
      take: limit,
      type,
      sort,
    });

    const grouped = {
      venues: items.filter((item) => item.type === "venue"),
      events: items.filter((item) => item.type === "event"),
      publicPlaces: items.filter((item) => item.type === "public_place"),
      communityEvents: items.filter((item) => item.type === "community_event"),
    };

    const totalPages = Math.ceil(total / limit);

    return {
      data: grouped,
      meta: {
        search,
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        type,
        sort,
      },
    };
  }
}
