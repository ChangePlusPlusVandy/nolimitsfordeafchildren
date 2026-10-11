import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type LocationEntity, LocationTable } from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { ListLocationsQuery } from "../_domain/types";

export async function listLocations(
  query: ListLocationsQuery = {},
): Promise<PaginatedResponse<LocationEntity>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const conditions = [];

  if (query.search) {
    const searchQuery = `%${query.search.trim()}%`;
    conditions.push(
      or(
        like(LocationTable.name, searchQuery),
        like(LocationTable.city, searchQuery),
        like(LocationTable.state, searchQuery),
      ),
    );
  }

  if (query.type) {
    conditions.push(eq(LocationTable.type, query.type));
  }

  if (query.is_active !== undefined) {
    conditions.push(eq(LocationTable.is_active, query.is_active));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(LocationTable)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  const sortColumn = query.sort === "created_at" ? LocationTable.created_at : LocationTable.name;
  const orderFn = query.order === "desc" ? desc : asc;

  const items = await db
    .select()
    .from(LocationTable)
    .where(whereClause)
    .orderBy(orderFn(sortColumn), asc(LocationTable.id))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(items, total, page, limit);
}
