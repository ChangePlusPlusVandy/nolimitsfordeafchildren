import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type UserEntity, UserTable } from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import type { ListUsersQuery } from "../_domain/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listUsers(query: ListUsersQuery): Promise<{
  items: UserEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page, limit, offset } = getPagination(query, DEFAULT_LIMIT, MAX_LIMIT);
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(like(UserTable.name, `%${query.search}%`), like(UserTable.email, `%${query.search}%`)),
    );
  }

  if (query.role) {
    conditions.push(eq(UserTable.role, query.role));
  }

  if (query.is_active !== undefined) {
    conditions.push(eq(UserTable.is_active, query.is_active));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserTable)
    .where(whereClause);
  const total = countResult[0]?.count || 0;

  const sortColumn =
    query.sort === "email"
      ? UserTable.email
      : query.sort === "created_at"
        ? UserTable.created_at
        : UserTable.name;
  const orderFn = query.order === "desc" ? desc : asc;
  const items = await db
    .select()
    .from(UserTable)
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(items, total, page, limit);
}
