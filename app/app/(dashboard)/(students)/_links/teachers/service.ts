import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { TeacherProfileTable, TeacherStudentTable, UserTable } from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

export async function teachers(
  studentId: string,
  query: { page?: number; limit?: number },
  // eslint-disable-next-line typescript/no-explicit-any -- preserve joined teacher payload contract
): Promise<PaginatedResponse<any>> {
  const { page, limit, offset } = getPagination(query, 20, 100);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(TeacherStudentTable)
    .where(
      and(eq(TeacherStudentTable.student_id, studentId), isNull(TeacherStudentTable.unassigned_at)),
    );
  const total = countResult[0]?.count ?? 0;
  const teacherLinks = await db
    .select({
      link_id: TeacherStudentTable.id,
      teacher_id: TeacherStudentTable.teacher_id,
      assigned_at: TeacherStudentTable.assigned_at,
      teacher_name: UserTable.name,
      teacher_email: UserTable.email,
    })
    .from(TeacherStudentTable)
    .innerJoin(TeacherProfileTable, eq(TeacherStudentTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .where(
      and(eq(TeacherStudentTable.student_id, studentId), isNull(TeacherStudentTable.unassigned_at)),
    )
    .orderBy(desc(TeacherStudentTable.assigned_at), desc(TeacherStudentTable.id))
    .limit(limit)
    .offset(offset);
  const items = teacherLinks.map((t) => ({
    link_id: t.link_id,
    teacher_id: t.teacher_id,
    name: t.teacher_name,
    email: t.teacher_email,
    assigned_at: t.assigned_at,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}

export async function listLinkableTeachers(
  query: { search?: string; page?: number; limit?: number } = {},
) {
  const { page, limit, offset } = getPagination(query, 50, 100);
  const conditions = [eq(UserTable.is_active, true)];

  if (query.search?.trim()) {
    const searchQuery = `%${query.search.trim()}%`;
    const searchCondition = or(
      like(UserTable.name, searchQuery),
      like(UserTable.email, searchQuery),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause = and(...conditions);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(TeacherProfileTable)
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;
  const rows = await db
    .select({ id: TeacherProfileTable.id, name: UserTable.name, email: UserTable.email })
    .from(TeacherProfileTable)
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .where(whereClause)
    .orderBy(asc(UserTable.name), asc(TeacherProfileTable.id))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(rows, total, page, limit);
}

export async function linkTeacher(
  studentId: string,
  teacherId: string,
): Promise<{ ok: boolean; link_id: string }> {
  const existing = await db
    .select()
    .from(TeacherStudentTable)
    .where(
      and(
        eq(TeacherStudentTable.student_id, studentId),
        eq(TeacherStudentTable.teacher_id, teacherId),
        isNull(TeacherStudentTable.unassigned_at),
      ),
    )
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    return { ok: true, link_id: existing[0].id };
  }

  const [link] = await db
    .insert(TeacherStudentTable)
    .values({ student_id: studentId, teacher_id: teacherId })
    .returning();

  if (!link) {
    throw new Error("Failed to link teacher");
  }

  return { ok: true, link_id: link.id };
}

export async function unlinkTeacher(
  studentId: string,
  teacherId: string,
): Promise<{ ok: boolean }> {
  await db
    .update(TeacherStudentTable)
    .set({ unassigned_at: new Date() })
    .where(
      and(
        eq(TeacherStudentTable.student_id, studentId),
        eq(TeacherStudentTable.teacher_id, teacherId),
        isNull(TeacherStudentTable.unassigned_at),
      ),
    );

  return { ok: true };
}
