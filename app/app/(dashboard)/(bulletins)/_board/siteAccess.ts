import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  ParentProfileTable,
  ParentStudentLinkTable,
  StudentTable,
  TeacherProfileTable,
} from "@/_platform/db/schema";

import type { UserRole } from "../_domain/types";

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

    if (!parentProfile[0]) {
      return null;
    }

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
