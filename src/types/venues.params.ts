export interface GetVenuesParams {
  search?: string;
  category?: string; // "all" atau code
  subCategory?: string; // "all" atau code
  page?: number;
  limit?: number;
  includeServices?: boolean; // default false
}

export interface FindVenuesParams {
  search?: string;
  category?: string;
  subCategory?: string;
  skip?: number;
  take?: number;
  includeServices?: boolean;
}
