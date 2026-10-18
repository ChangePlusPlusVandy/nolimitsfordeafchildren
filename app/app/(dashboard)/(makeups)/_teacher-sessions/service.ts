import { and, eq, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  MakeupSessionTable,
  StudentTable,
  TeacherProfileTable,
  type MakeupSessionEntity,
} from "@/_platform/db/schema";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { AttendanceStatus, MakeupSessionWithDetails } from "./types";

export async function isTeacherAuthorizedForSession(
  teacherUserId: string,
  teacherProfileId: string,
): Promise<boolean> {
  const profile = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(
      and(
        eq(TeacherProfileTable.id, teacherProfileId),
        eq(TeacherProfileTable.user_id, teacherUserId),
      ),
    )
    .limit(1);

  return profile.length > 0;
}

/**
 * Assert that the authenticated teacher (by user ID) owns the given make-up
 * session. Admins bypass this check — callers only invoke this for teacher
 * role; see `markMakeupSessionAttendance` in actions.ts.
 *
 * - Session not found        → NotFoundError  (no information about the ID)
 * - Profile missing / mismatched → ForbiddenError (no session details leaked)
 */
export async function assertTeacherOwnsMakeupSession(
  teacherUserId: string,
  sessionId: string,
): Promise<MakeupSessionEntity> {
  const [session] = await db
    .select()
    .from(MakeupSessionTable)
    .where(eq(MakeupSessionTable.id, sessionId))
    .limit(1);

  if (!session) {
    throw new NotFoundError("Makeup session not found");
  }

  const [profile] = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, teacherUserId))
    .limit(1);

  if (!profile || profile.id !== session.teacher_id) {
    throw new ForbiddenError("You can only mark attendance for your own make-up sessions");
  }

  return session;
}

export async function listSessionsForTeacher(
  teacherId: string,
  query: { date?: string; page?: number; limit?: number } = {},
): Promise<PaginatedResponse<MakeupSessionWithDetails>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const conditions = [eq(MakeupSessionTable.teacher_id, teacherId)];

  if (query.date) {
    conditions.push(eq(MakeupSessionTable.scheduled_date, query.date));
  }

  const whereClause = and(...conditions);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(MakeupSessionTable)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  const results = await db
    .select({
      id: MakeupSessionTable.id,
      makeup_request_id: MakeupSessionTable.makeup_request_id,
      student_id: MakeupSessionTable.student_id,
      teacher_id: MakeupSessionTable.teacher_id,
      site_id: MakeupSessionTable.site_id,
      scheduled_date: MakeupSessionTable.scheduled_date,
      scheduled_time: MakeupSessionTable.scheduled_time,
      attendance_status: MakeupSessionTable.attendance_status,
      notes: MakeupSessionTable.notes,
      created_by: MakeupSessionTable.created_by,
      created_at: MakeupSessionTable.created_at,
      updated_at: MakeupSessionTable.updated_at,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
      site_name: LocationTable.name,
    })
    .from(MakeupSessionTable)
    .innerJoin(StudentTable, eq(MakeupSessionTable.student_id, StudentTable.id))
    .innerJoin(LocationTable, eq(MakeupSessionTable.site_id, LocationTable.id))
    .where(whereClause)
    .orderBy(MakeupSessionTable.scheduled_date, MakeupSessionTable.scheduled_time)
    .limit(limit)
    .offset(offset);

  const items: MakeupSessionWithDetails[] = results.map((row) => ({
    id: row.id,
    makeup_request_id: row.makeup_request_id,
    student_id: row.student_id,
    teacher_id: row.teacher_id,
    site_id: row.site_id,
    scheduled_date: row.scheduled_date,
    scheduled_time: row.scheduled_time,
    attendance_status: row.attendance_status,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: {
      id: row.student_id,
      initials: row.student_initials,
      first_name: row.student_first_name,
      last_name: row.student_last_name,
    },
    site: {
      id: row.site_id,
      name: row.site_name,
    },
  }));

  return buildPaginatedResponse(items, total, page, limit);
}

export async function markSessionAttendance(
  sessionId: string,
  status: AttendanceStatus,
): Promise<MakeupSessionEntity | null> {
  const result = await db
    .update(MakeupSessionTable)
    .set({
      attendance_status: status,
      updated_at: new Date(),
    })
    .where(eq(MakeupSessionTable.id, sessionId))
    .returning();

  return result[0] ?? null;
}
