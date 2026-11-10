import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { DocumentTable, StudentTable } from "@/_platform/db/schema";
import { addDaysStr, todayStr } from "@/_shared/server/dates";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { DocumentWithMetadata } from "../_domain/types";
import type { WithMetadata } from "../_list/metadata";

export async function getOverdueAudiograms(
  daysAhead: number,
  query: { page?: number; limit?: number },
  addMetadata: WithMetadata,
): Promise<PaginatedResponse<DocumentWithMetadata>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const checkDate = addDaysStr(todayStr(), daysAhead);

  const whereClause = and(
    eq(DocumentTable.document_type, "audiogram"),
    lte(DocumentTable.next_due_date, checkDate),
  );

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(DocumentTable)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  const results = await db
    .select()
    .from(DocumentTable)
    .where(whereClause)
    .orderBy(DocumentTable.next_due_date)
    .limit(limit)
    .offset(offset);

  const items = results.map((doc) => addMetadata(doc));

  return buildPaginatedResponse(items, total, page, limit);
}

export async function getAudiogramsDueSoon(
  daysAhead: number,
  query: { page?: number; limit?: number },
  addMetadata: WithMetadata,
): Promise<
  PaginatedResponse<
    DocumentWithMetadata & {
      student?: { id: string; first_name: string; last_name: string; initials: string };
    }
  >
> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const today = todayStr();
  const futureDate = addDaysStr(today, daysAhead);

  const whereClause = and(
    eq(DocumentTable.document_type, "audiogram"),
    eq(DocumentTable.entity_type, "student"),
    gte(DocumentTable.next_due_date, today),
    lte(DocumentTable.next_due_date, futureDate),
  );

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(DocumentTable)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  const results = await db
    .select({
      id: DocumentTable.id,
      entity_type: DocumentTable.entity_type,
      entity_id: DocumentTable.entity_id,
      document_type: DocumentTable.document_type,
      file_url: DocumentTable.file_url,
      file_name: DocumentTable.file_name,
      file_size: DocumentTable.file_size,
      mime_type: DocumentTable.mime_type,
      document_date: DocumentTable.document_date,
      next_due_date: DocumentTable.next_due_date,
      review_status: DocumentTable.review_status,
      reviewed_by: DocumentTable.reviewed_by,
      reviewed_at: DocumentTable.reviewed_at,
      review_notes: DocumentTable.review_notes,
      session_date: DocumentTable.session_date,
      session_type: DocumentTable.session_type,
      uploaded_by: DocumentTable.uploaded_by,
      created_at: DocumentTable.created_at,
      updated_at: DocumentTable.updated_at,
      student_id: StudentTable.id,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
      student_initials: StudentTable.initials,
    })
    .from(DocumentTable)
    .leftJoin(StudentTable, eq(DocumentTable.entity_id, StudentTable.id))
    .where(whereClause)
    .orderBy(DocumentTable.next_due_date)
    .limit(limit)
    .offset(offset);

  const items = results.map((row) => ({
    ...addMetadata({
      id: row.id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      document_type: row.document_type,
      file_url: row.file_url,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      document_date: row.document_date,
      next_due_date: row.next_due_date,
      review_status: row.review_status,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      review_notes: row.review_notes,
      session_date: row.session_date,
      session_type: row.session_type,
      uploaded_by: row.uploaded_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
    student: row.student_id
      ? {
          id: row.student_id,
          first_name: row.student_first_name!,
          last_name: row.student_last_name!,
          initials: row.student_initials!,
        }
      : undefined,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
