import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { SessionNoteTable, StudentTable } from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { SessionNoteWithDetails } from "../_domain/types";

export async function listByTeacher(
  teacherId: string,
  query: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<SessionNoteWithDetails>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(SessionNoteTable)
    .where(eq(SessionNoteTable.teacher_id, teacherId));
  const total = countResult[0]?.count ?? 0;
  const results = await db
    .select({
      id: SessionNoteTable.id,
      student_id: SessionNoteTable.student_id,
      teacher_id: SessionNoteTable.teacher_id,
      schedule_id: SessionNoteTable.schedule_id,
      session_date: SessionNoteTable.session_date,
      note: SessionNoteTable.note,
      created_at: SessionNoteTable.created_at,
      updated_at: SessionNoteTable.updated_at,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
    })
    .from(SessionNoteTable)
    .innerJoin(StudentTable, eq(SessionNoteTable.student_id, StudentTable.id))
    .where(eq(SessionNoteTable.teacher_id, teacherId))
    .orderBy(desc(SessionNoteTable.created_at), desc(SessionNoteTable.id))
    .limit(limit)
    .offset(offset);
  const items = results.map((row) => ({
    id: row.id,
    student_id: row.student_id,
    teacher_id: row.teacher_id,
    schedule_id: row.schedule_id,
    session_date: row.session_date,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: {
      id: row.student_id,
      initials: row.student_initials,
      first_name: row.student_first_name,
      last_name: row.student_last_name,
    },
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
