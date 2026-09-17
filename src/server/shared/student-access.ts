import { and, eq, isNull } from "drizzle-orm";
import {
  EnrollmentTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  TeacherProfileTable,
  TeacherStudentTable,
  type UserEntity,
} from "@/db/schema";
import { db } from "@/lib/db";
import { isParentLinkedToStudent } from "@/server/parents/parent-access";
import { ForbiddenError, NotFoundError } from "@/server/shared/errors";

export async function getTeacherProfileIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: TeacherProfileTable.id })
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, userId))
    .limit(1);

  return row?.id ?? null;
}

export async function isTeacherAssignedToStudent(
  teacherProfileId: string,
  studentId: string,
): Promise<boolean> {
  const [link] = await db
    .select({ id: TeacherStudentTable.id })
    .from(TeacherStudentTable)
    .where(
      and(
        eq(TeacherStudentTable.teacher_id, teacherProfileId),
        eq(TeacherStudentTable.student_id, studentId),
        isNull(TeacherStudentTable.unassigned_at),
      ),
    )
    .limit(1);

  return Boolean(link);
}

/**
 * Read-scope check for a student. Admins pass. Teachers must have an active
 * assignment; parents an active parent_student_link. Failures look like a
 * missing student so IDs cannot be enumerated.
 */
export async function assertCanAccessStudent(
  user: Pick<UserEntity, "id" | "role">,
  studentId: string,
): Promise<void> {
  if (user.role === "administrator") {
    return;
  }

  if (user.role === "teacher") {
    const profileId = await getTeacherProfileIdForUser(user.id);
    if (profileId && (await isTeacherAssignedToStudent(profileId, studentId))) {
      return;
    }
    throw new NotFoundError("Student not found");
  }

  if (user.role === "parent") {
    if (await isParentLinkedToStudent(user.id, studentId)) {
      return;
    }
    throw new NotFoundError("Student not found");
  }

  throw new ForbiddenError("Insufficient role");
}

export async function assertTeacherAssignedToStudent(
  teacherUserId: string,
  studentId: string,
): Promise<string> {
  const profileId = await getTeacherProfileIdForUser(teacherUserId);
  if (!profileId) {
    throw new ForbiddenError("Only teachers can perform this action");
  }
  if (!(await isTeacherAssignedToStudent(profileId, studentId))) {
    throw new ForbiddenError("You can only modify records for your assigned students");
  }
  return profileId;
}

export async function assertTeacherCanMarkStudentSchedule(
  teacherUserId: string,
  studentId: string,
  scheduleId: string,
): Promise<void> {
  const profileId = await assertTeacherAssignedToStudent(teacherUserId, studentId);

  const [schedule] = await db
    .select({ teacher_id: ScheduleTable.teacher_id })
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, scheduleId))
    .limit(1);

  if (!schedule || schedule.teacher_id !== profileId) {
    throw new ForbiddenError("You can only mark attendance for your own schedules");
  }

  const [enrollment] = await db
    .select({ id: EnrollmentTable.id })
    .from(EnrollmentTable)
    .where(
      and(
        eq(EnrollmentTable.student_id, studentId),
        eq(EnrollmentTable.schedule_id, scheduleId),
        isNull(EnrollmentTable.ended_at),
      ),
    )
    .limit(1);

  if (!enrollment) {
    throw new ForbiddenError("Student is not enrolled in this schedule");
  }
}

export async function assertCanAccessTeacherRecord(
  user: Pick<UserEntity, "id" | "role">,
  teacherProfileId: string,
): Promise<void> {
  if (user.role === "administrator") {
    return;
  }
  if (user.role === "teacher") {
    const profileId = await getTeacherProfileIdForUser(user.id);
    if (profileId === teacherProfileId) {
      return;
    }
  }
  throw new ForbiddenError("You cannot access this teacher's records");
}

export async function isParentLinkedToTeacher(
  parentUserId: string,
  teacherProfileId: string,
): Promise<boolean> {
  const [parentProfile] = await db
    .select({ id: ParentProfileTable.id })
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUserId))
    .limit(1);
  if (!parentProfile) {
    return false;
  }

  const [link] = await db
    .select({ id: TeacherStudentTable.id })
    .from(TeacherStudentTable)
    .innerJoin(
      ParentStudentLinkTable,
      and(
        eq(ParentStudentLinkTable.student_id, TeacherStudentTable.student_id),
        eq(ParentStudentLinkTable.parent_id, parentProfile.id),
        isNull(ParentStudentLinkTable.revoked_at),
      ),
    )
    .where(
      and(
        eq(TeacherStudentTable.teacher_id, teacherProfileId),
        isNull(TeacherStudentTable.unassigned_at),
      ),
    )
    .limit(1);

  return Boolean(link);
}

/** Teacher profile/detail visibility (email/phone). */
export async function assertCanViewTeacherProfile(
  user: Pick<UserEntity, "id" | "role">,
  teacherProfileId: string,
): Promise<void> {
  if (user.role === "administrator" || user.role === "teacher") {
    return;
  }
  if (user.role === "parent" && (await isParentLinkedToTeacher(user.id, teacherProfileId))) {
    return;
  }
  throw new NotFoundError("Teacher not found");
}
