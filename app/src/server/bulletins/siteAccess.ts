import { and, eq, isNull } from "drizzle-orm";

import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { UserRole } from "@/server/bulletins/types";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/shared/errors";

export async function getUserSiteId(userId: string, role: UserRole): Promise<string | null> {
  if (role === "administrator") {
    return null;
  }

  if (role === "teacher") {
    const teacherProfile = await db
      .select({ site_id: TeacherProfileTable.primary_site_id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, userId))
      .limit(1);

    return teacherProfile[0]?.site_id ?? null;
  }

  if (role === "parent") {
    const parentProfile = await db
      .select({ id: ParentProfileTable.id })
      .from(ParentProfileTable)
      .where(eq(ParentProfileTable.user_id, userId))
      .limit(1);

    if (!parentProfile[0]) return null;

    const linkedStudent = await db
      .select({ site_id: StudentTable.site_id })
      .from(ParentStudentLinkTable)
      .innerJoin(StudentTable, eq(ParentStudentLinkTable.student_id, StudentTable.id))
      .where(
        and(
          eq(ParentStudentLinkTable.parent_id, parentProfile[0].id),
          isNull(ParentStudentLinkTable.revoked_at),
        ),
      )
      .limit(1);

    return linkedStudent[0]?.site_id ?? null;
  }

  return null;
}

export async function resolveTeacherPostingSite(
  userId: string,
  requestedSiteId?: string | null,
): Promise<string> {
  const teacherProfile = await db
    .select({ id: TeacherProfileTable.id, primary_site_id: TeacherProfileTable.primary_site_id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, userId))
    .limit(1);

  if (!teacherProfile[0]) {
    throw new NotFoundError("Teacher profile not found");
  }

  if (requestedSiteId) {
    if (teacherProfile[0].primary_site_id === requestedSiteId) {
      return requestedSiteId;
    }

    const assignedSite = await db
      .select({ id: TeacherLocationTable.id })
      .from(TeacherLocationTable)
      .where(
        and(
          eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id),
          eq(TeacherLocationTable.location_id, requestedSiteId),
        ),
      )
      .limit(1);

    if (assignedSite[0]) {
      return requestedSiteId;
    }

    throw new ForbiddenError("Teacher is not assigned to the selected site");
  }

  if (teacherProfile[0].primary_site_id) {
    return teacherProfile[0].primary_site_id;
  }

  const fallbackSite = await db
    .select({ location_id: TeacherLocationTable.location_id })
    .from(TeacherLocationTable)
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0].id))
    .orderBy(TeacherLocationTable.assigned_at)
    .limit(1);

  if (fallbackSite[0]?.location_id) {
    return fallbackSite[0].location_id;
  }

  throw new BadRequestError("Teacher must have an assigned site to create bulletins");
}
