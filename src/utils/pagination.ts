export interface PaginatedQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function normalizePage(page?: number): number {
  if (!Number.isFinite(page) || !page || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export function normalizeLimit(
  limit?: number,
  defaultLimit: number = 20,
  maxLimit: number = 100,
): number {
  if (!Number.isFinite(limit) || !limit || limit < 1) {
    return defaultLimit;
  }

  return Math.min(Math.floor(limit), maxLimit);
}

export function getPagination(
  query: PaginatedQuery,
  defaultLimit: number = 20,
  maxLimit: number = 100,
) {
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit, defaultLimit, maxLimit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
