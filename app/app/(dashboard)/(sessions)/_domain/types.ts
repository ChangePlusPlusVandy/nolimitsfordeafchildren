import type { PaginatedQuery } from "@/_shared/server/pagination";

export interface ListSessionsQuery extends PaginatedQuery {
  include_archived?: boolean;
  active_only?: boolean;
}

export interface CreateSessionInput {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface UpdateSessionInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_archived?: boolean;
}

export type SessionEntity = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export interface PaginatedSessionsResponse {
  items: SessionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
