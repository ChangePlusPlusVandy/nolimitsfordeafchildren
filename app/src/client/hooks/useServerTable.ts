"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

/**
 * Server-driven table state synced to the URL query string.
 * Ported from the legacy Vite app (react-router useSearchParams → next/navigation).
 */
export function useServerTable(options: UseServerTableOptions = {}): ServerTableState {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    defaultSearch = "",
    defaultSort,
    defaultOrder,
    debounceMs = 300,
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // next/navigation returns null when there is no query string (or during SSR).
  const params = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);

  const page = Number(params.get("page") || defaultPage);
  const limit = Number(params.get("limit") || defaultLimit);
  const sort = params.get("sort") || defaultSort;
  const order = (params.get("order") as "asc" | "desc" | null) || defaultOrder;

  const [searchInput, setSearchInput] = useState(params.get("search") || defaultSearch);

  useEffect(() => {
    const currentSearch = params.get("search") || "";
    if (currentSearch !== searchInput) {
      setSearchInput(currentSearch);
    }
    // intentionally not depending on searchInput to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, searchInput]);

  const debouncedSearch = useDebouncedValue(searchInput, debounceMs);

  /** Push new query params to the URL without changing the path. */
  const applyParams = useCallback(
    (next: URLSearchParams, replace = false) => {
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router[replace ? "replace" : "push"](href, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const currentSearch = params.get("search") || "";
    if (debouncedSearch === currentSearch) {
      return;
    }

    const next = new URLSearchParams(params.toString());

    if (debouncedSearch.trim()) {
      next.set("search", debouncedSearch.trim());
    } else {
      next.delete("search");
    }

    next.set("page", "1");
    applyParams(next, true);
  }, [debouncedSearch, applyParams, params]);

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    applyParams(next);
  };

  const setLimit = (nextLimit: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("limit", String(nextLimit));
    next.set("page", "1");
    applyParams(next);
  };

  const setSearch = (search: string) => {
    setSearchInput(search);
  };

  const setSort = (nextSort?: string) => {
    const next = new URLSearchParams(params.toString());
    if (nextSort) {
      next.set("sort", nextSort);
    } else {
      next.delete("sort");
    }
    next.set("page", "1");
    applyParams(next);
  };

  const setOrder = (nextOrder?: "asc" | "desc") => {
    const next = new URLSearchParams(params.toString());
    if (nextOrder) {
      next.set("order", nextOrder);
    } else {
      next.delete("order");
    }
    next.set("page", "1");
    applyParams(next);
  };

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value.length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    applyParams(next);
  };

  const getFilter = (key: string) => params.get(key) || "";

  const queryParams = useMemo(() => {
    const result: Record<string, string | number | boolean> = {
      page,
      limit,
    };

    if (debouncedSearch.trim()) {
      result.search = debouncedSearch.trim();
    }

    if (sort) {
      result.sort = sort;
    }

    if (order) {
      result.order = order;
    }

    for (const [key, value] of params.entries()) {
      if (["page", "limit", "search", "sort", "order"].includes(key)) {
        continue;
      }
      result[key] = value;
    }

    return result;
  }, [page, limit, debouncedSearch, sort, order, params]);

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
