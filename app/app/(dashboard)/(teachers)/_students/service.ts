import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import { LocationTable, StudentTable, TeacherStudentTable } from "@/_platform/db/schema";
import { buildPaginatedResponse, getPagination } from "@/_shared/server/pagination";

import { requireTeacherProfileId } from "../_resolve/service";

export async function getTeacherStudents(id: string, query: { page?: number; limit?: number }) {
  const profileId = await requireTeacherProfileId(id);
  const { page, limit, offset } = getPagination(query, 20, 100);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(TeacherStudentTable)
    .where(
      and(eq(TeacherStudentTable.teacher_id, profileId), isNull(TeacherStudentTable.unassigned_at)),
    );

  const total = countResult[0]?.count || 0;

  const results = await db
    .select({
      id: StudentTable.id,
      first_name: StudentTable.first_name,
      last_name: StudentTable.last_name,
      initials: StudentTable.initials,
      dob: StudentTable.dob,
      is_active: StudentTable.is_active,
      assigned_at: TeacherStudentTable.assigned_at,
      site_id: LocationTable.id,
      site_name: LocationTable.name,
    })
    .from(TeacherStudentTable)
    .innerJoin(StudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
    .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
    .where(
      and(eq(TeacherStudentTable.teacher_id, profileId), isNull(TeacherStudentTable.unassigned_at)),
    )
    .orderBy(asc(StudentTable.last_name))
    .limit(limit)
    .offset(offset);

  const items = results.map((r) => ({
    id: r.id,
    initials: r.initials,
    dob: r.dob,
    is_active: r.is_active,
    assigned_at: r.assigned_at,
    site: { id: r.site_id, name: r.site_name },
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
