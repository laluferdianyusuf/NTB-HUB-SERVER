import { GlobalSearchResult, SearchRepository } from "repositories";

export class SearchService {
  constructor(private searchRepo: SearchRepository) {}

  async globalSearch(params: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: GlobalSearchResult[];
    page: number;
    limit: number;
  }> {
    const search = params.search?.trim() || "";

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 && params.limit <= 50
        ? params.limit
        : 20;
    const skip = (page - 1) * limit;

    let results: GlobalSearchResult[];

    if (!search) {
      results = await this.searchRepo.globalSearch({
        search: "",
        skip,
        take: limit,
      });
    } else {
      results = await this.searchRepo.globalSearch({
        search,
        skip,
        take: limit,
      });
    }

    return {
      data: results,
      page,
      limit,
    };
  }
}
