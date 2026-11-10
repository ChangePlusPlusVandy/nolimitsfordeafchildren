import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type StudentEntity,
  StudentTable,
  TeacherProfileTable,
  TeacherStudentTable,
} from "@/_platform/db/schema";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import type { UserRole } from "../_domain/types";

export async function updateGuardianSummary(
  id: string,
  guardianSummary: string | null,
  user: { id: string; role: UserRole },
): Promise<StudentEntity | null> {
  const existingStudent = await db
    .select({ id: StudentTable.id })
    .from(StudentTable)
    .where(eq(StudentTable.id, id))
    .limit(1);

  if (existingStudent.length === 0) {
    return null;
  }

  if (user.role === "teacher") {
    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, user.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new NotFoundError("Teacher profile not found");
    }

    const teacherLink = await db
      .select({ id: TeacherStudentTable.id })
      .from(TeacherStudentTable)
      .where(
        and(
          eq(TeacherStudentTable.student_id, id),
          eq(TeacherStudentTable.teacher_id, teacherProfile[0]!.id),
          isNull(TeacherStudentTable.unassigned_at),
        ),
      )
      .limit(1);

    if (teacherLink.length === 0) {
      throw new ForbiddenError(
        "You do not have permission to update this student's guardian summary",
      );
    }
  }

  const [student] = await db
    .update(StudentTable)
    .set({ guardian_summary: guardianSummary, updated_at: new Date() })
    .where(eq(StudentTable.id, id))
    .returning();

  return student || null;
}
