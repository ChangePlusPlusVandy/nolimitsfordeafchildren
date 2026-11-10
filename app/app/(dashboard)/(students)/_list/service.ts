import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  type StudentEntity,
  StudentTable,
  TeacherProfileTable,
  TeacherStudentTable,
} from "@/_platform/db/schema";
import {
  buildPaginatedResponse,
  getPagination,
  type PaginatedResponse,
} from "@/_shared/server/pagination";

import type { StudentFilters, UserRole } from "../_domain/types";

export async function index(
  filters: StudentFilters,
  userRole: UserRole,
  userId?: string,
  // eslint-disable-next-line typescript/no-explicit-any -- preserve the role-scoped list contract
): Promise<PaginatedResponse<any>> {
  const { page, limit, offset } = getPagination(filters, 20, 100);

  // eslint-disable-next-line typescript/no-explicit-any -- drizzle where-condition array
  const conditions: any[] = [];

  if (filters.search) {
    const searchQuery = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        like(StudentTable.initials, searchQuery),
        like(StudentTable.first_name, searchQuery),
        like(StudentTable.last_name, searchQuery),
      ),
    );
  }

  if (filters.site_id) {
    conditions.push(eq(StudentTable.site_id, filters.site_id));
  }

  if (filters.is_active !== undefined) {
    conditions.push(eq(StudentTable.is_active, filters.is_active));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn =
    filters.sort === "created_at"
      ? StudentTable.created_at
      : filters.sort === "dob"
        ? StudentTable.dob
        : StudentTable.initials;
  const orderFn = filters.order === "desc" ? desc : asc;
  const secondarySort = filters.order === "desc" ? desc(StudentTable.id) : asc(StudentTable.id);

  let students: Array<
    Pick<
      StudentEntity,
      | "id"
      | "site_id"
      | "first_name"
      | "last_name"
      | "initials"
      | "photo_url"
      | "dob"
      | "current_school"
      | "preferred_language"
      | "guardian_summary"
      | "is_active"
      | "created_at"
      | "updated_at"
    >
  >;
  let total = 0;

  if (userRole === "administrator") {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(StudentTable)
      .where(whereClause);

    total = countResult[0]?.count ?? 0;

    students = await db
      .select()
      .from(StudentTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), secondarySort)
      .limit(limit)
      .offset(offset);
  } else if (userRole === "teacher" && userId) {
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    if (!teacherProfile.length) {
      return buildPaginatedResponse([], 0, page, limit);
    }

    const teacherProfileId = teacherProfile[0]!.id;
    const teacherScope = and(
      eq(TeacherStudentTable.teacher_id, teacherProfileId),
      isNull(TeacherStudentTable.unassigned_at),
    );
    const teacherWhereClause = whereClause ? and(teacherScope, whereClause) : teacherScope;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(StudentTable)
      .innerJoin(TeacherStudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
      .where(teacherWhereClause);

    total = countResult[0]?.count ?? 0;

    students = await db
      .select({
        id: StudentTable.id,
        site_id: StudentTable.site_id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        photo_url: StudentTable.photo_url,
        dob: StudentTable.dob,
        current_school: StudentTable.current_school,
        preferred_language: StudentTable.preferred_language,
        guardian_summary: StudentTable.guardian_summary,
        is_active: StudentTable.is_active,
        created_at: StudentTable.created_at,
        updated_at: StudentTable.updated_at,
      })
      .from(StudentTable)
      .innerJoin(TeacherStudentTable, eq(TeacherStudentTable.student_id, StudentTable.id))
      .where(teacherWhereClause)
      .orderBy(orderFn(sortColumn), secondarySort)
      .limit(limit)
      .offset(offset);
  } else if (userRole === "parent" && userId) {
    const parentProfile = await db
      .select()
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, userId))
      .limit(1);

    if (!parentProfile.length) {
      return buildPaginatedResponse([], 0, page, limit);
    }

    const parentProfileId = parentProfile[0]!.id;
    const parentScope = and(
      eq(ParentStudentLinkTable.parent_id, parentProfileId),
      isNull(ParentStudentLinkTable.revoked_at),
    );
    const parentWhereClause = whereClause ? and(parentScope, whereClause) : parentScope;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(StudentTable)
      .innerJoin(ParentStudentLinkTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(parentWhereClause);

    total = countResult[0]?.count ?? 0;

    students = await db
      .select({
        id: StudentTable.id,
        site_id: StudentTable.site_id,
        first_name: StudentTable.first_name,
        last_name: StudentTable.last_name,
        initials: StudentTable.initials,
        photo_url: StudentTable.photo_url,
        dob: StudentTable.dob,
        current_school: StudentTable.current_school,
        preferred_language: StudentTable.preferred_language,
        guardian_summary: StudentTable.guardian_summary,
        is_active: StudentTable.is_active,
        created_at: StudentTable.created_at,
        updated_at: StudentTable.updated_at,
      })
      .from(StudentTable)
      .innerJoin(ParentStudentLinkTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(parentWhereClause)
      .orderBy(orderFn(sortColumn), secondarySort)
      .limit(limit)
      .offset(offset);
  } else {
    return buildPaginatedResponse([], 0, page, limit);
  }

  // Full PII stays on authorized detail pages.
  const items = students.map((student) => ({
    id: student.id,
    initials: student.initials,
    site_id: student.site_id,
    dob: student.dob,
    is_active: student.is_active,
  }));

  return buildPaginatedResponse(items, total, page, limit);
}
