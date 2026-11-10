import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { DocumentTable } from "@/_platform/db/schema";

import type {
  DocumentReviewStatus,
  DocumentWithMetadata,
  EntityType,
  ListDocumentsQuery,
  PaginatedDocumentsResult,
} from "../_domain/types";
import type { WithMetadata } from "./metadata";

export async function listForEntity(
  entityType: EntityType,
  entityId: string,
  addMetadata: WithMetadata,
): Promise<DocumentWithMetadata[]> {
  const results = await db
    .select()
    .from(DocumentTable)
    .where(and(eq(DocumentTable.entity_type, entityType), eq(DocumentTable.entity_id, entityId)))
    .orderBy(desc(DocumentTable.created_at));

  return results.map((doc) => addMetadata(doc));
}

export async function listForEntityPaginated(
  entityType: EntityType,
  entityId: string,
  query: { page?: number; limit?: number; review_status?: DocumentReviewStatus },
  addMetadata: WithMetadata,
): Promise<PaginatedDocumentsResult> {
  const page = Math.max(query.page || 1, 1);
  const limit = Math.min(Math.max(query.limit || 10, 1), 100);
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(DocumentTable.entity_type, entityType),
    eq(DocumentTable.entity_id, entityId),
    query.review_status ? eq(DocumentTable.review_status, query.review_status) : undefined,
  );

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(DocumentTable)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  const results = await db
    .select()
    .from(DocumentTable)
    .where(whereClause)
    .orderBy(desc(DocumentTable.created_at))
    .limit(limit)
    .offset(offset);

  return {
    items: results.map((doc) => addMetadata(doc)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listDocuments(
  query: ListDocumentsQuery,
  addMetadata: WithMetadata,
): Promise<{
  items: DocumentWithMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.entity_type) {
    conditions.push(eq(DocumentTable.entity_type, query.entity_type));
  }

  if (query.entity_id) {
    conditions.push(eq(DocumentTable.entity_id, query.entity_id));
  }

  if (query.document_type) {
    conditions.push(eq(DocumentTable.document_type, query.document_type));
  }

  if (query.review_status) {
    conditions.push(eq(DocumentTable.review_status, query.review_status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(DocumentTable)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  const results = await db
    .select()
    .from(DocumentTable)
    .where(whereClause)
    .orderBy(desc(DocumentTable.created_at))
    .limit(limit)
    .offset(offset);

  const items = results.map((doc) => addMetadata(doc));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
