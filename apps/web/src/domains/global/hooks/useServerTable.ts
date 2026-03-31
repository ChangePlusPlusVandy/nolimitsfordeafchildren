import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => globalThis.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

export interface UseServerTableOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultSearch?: string;
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
  debounceMs?: number;
}

export interface ServerTableState {
  page: number;
  limit: number;
  search: string;
  debouncedSearch: string;
  sort?: string;
  order?: "asc" | "desc";
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort?: string) => void;
  setOrder: (order?: "asc" | "desc") => void;
  setFilter: (key: string, value?: string) => void;
  getFilter: (key: string) => string;
  queryParams: Record<string, string | number | boolean>;
}

export function useServerTable(options: UseServerTableOptions = {}): ServerTableState {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    defaultSearch = "",
    defaultSort,
    defaultOrder,
    debounceMs = 300,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || defaultPage);
  const limit = Number(searchParams.get("limit") || defaultLimit);
  const sort = searchParams.get("sort") || defaultSort;
  const order = (searchParams.get("order") as "asc" | "desc" | null) || defaultOrder;

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || defaultSearch);

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (currentSearch !== searchInput) {
      setSearchInput(currentSearch);
    }
    // intentionally not depending on searchInput to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const debouncedSearch = useDebouncedValue(searchInput, debounceMs);

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedSearch === currentSearch) {
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (debouncedSearch.trim()) {
      next.set("search", debouncedSearch.trim());
    } else {
      next.delete("search");
    }

    next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const setLimit = (nextLimit: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("limit", String(nextLimit));
    next.set("page", "1");
    setSearchParams(next);
  };

  const setSearch = (search: string) => {
    setSearchInput(search);
  };

  const setSort = (nextSort?: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextSort) {
      next.set("sort", nextSort);
    } else {
      next.delete("sort");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setOrder = (nextOrder?: "asc" | "desc") => {
    const next = new URLSearchParams(searchParams);
    if (nextOrder) {
      next.set("order", nextOrder);
    } else {
      next.delete("order");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value.length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const getFilter = (key: string) => searchParams.get(key) || "";

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      limit,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (sort) {
      params.sort = sort;
    }

    if (order) {
      params.order = order;
    }

    for (const [key, value] of searchParams.entries()) {
      if (["page", "limit", "search", "sort", "order"].includes(key)) {
        continue;
      }
      params[key] = value;
    }

    return params;
  }, [page, limit, debouncedSearch, sort, order, searchParams]);

  return {
    page,
    limit,
    search: searchInput,
    debouncedSearch,
    sort: sort || undefined,
    order: order || undefined,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setOrder,
    setFilter,
    getFilter,
    queryParams,
  };
}
