import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type EnrollmentEntity,
  EnrollmentTable,
  ScheduleTable,
  StudentTable,
} from "@/_platform/db/schema";
import { BadRequestError, ConflictError, NotFoundError } from "@/_shared/server/errors";

export async function endEnrollment(
  scheduleId: string,
  enrollmentId: string,
): Promise<EnrollmentEntity> {
  const [existing] = await db
    .select({
      id: EnrollmentTable.id,
      schedule_id: EnrollmentTable.schedule_id,
      ended_at: EnrollmentTable.ended_at,
    })
    .from(EnrollmentTable)
    .where(eq(EnrollmentTable.id, enrollmentId))
    .limit(1);

  if (!existing || existing.schedule_id !== scheduleId) {
    throw new NotFoundError("Enrollment not found");
  }
  if (existing.ended_at) {
    throw new BadRequestError("Enrollment has already ended");
  }

  const now = new Date();
  const [updated] = await db
    .update(EnrollmentTable)
    .set({ ended_at: now, updated_at: now })
    .where(
      and(
        eq(EnrollmentTable.id, enrollmentId),
        eq(EnrollmentTable.schedule_id, scheduleId),
        isNull(EnrollmentTable.ended_at),
      ),
    )
    .returning();

  if (!updated) {
    throw new BadRequestError("Enrollment has already ended");
  }
  return updated;
}

/**
 * Re-enroll a student who previously ended on this schedule by inserting a new row.
 */
export async function reenrollStudent(
  scheduleId: string,
  studentId: string,
): Promise<EnrollmentEntity> {
  const [schedule] = await db
    .select({ id: ScheduleTable.id })
    .from(ScheduleTable)
    .where(eq(ScheduleTable.id, scheduleId))
    .limit(1);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const [student] = await db
    .select({ id: StudentTable.id })
    .from(StudentTable)
    .where(eq(StudentTable.id, studentId))
    .limit(1);
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  // D1 has no interactive transactions and no partial unique index on active rows,
  // so the active-row guard must live in the same statement as the insert.
  const id = crypto.randomUUID();
  const now = Date.now();
  const inserted = await db.all<{ id: string }>(sql`
    INSERT INTO enrollments (id, student_id, schedule_id, enrolled_at, created_at, updated_at)
    SELECT ${id}, ${studentId}, ${scheduleId}, ${now}, ${now}, ${now}
    WHERE NOT EXISTS (
      SELECT 1 FROM enrollments
      WHERE schedule_id = ${scheduleId} AND student_id = ${studentId} AND ended_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE schedule_id = ${scheduleId} AND student_id = ${studentId} AND ended_at IS NOT NULL
    )
    RETURNING id
  `);

  if (inserted.length === 0) {
    const [active] = await db
      .select({ id: EnrollmentTable.id })
      .from(EnrollmentTable)
      .where(
        and(
          eq(EnrollmentTable.schedule_id, scheduleId),
          eq(EnrollmentTable.student_id, studentId),
          isNull(EnrollmentTable.ended_at),
        ),
      )
      .limit(1);
    if (active) {
      throw new ConflictError("Student is already enrolled in this schedule");
    }
    throw new BadRequestError("Student has no ended enrollment on this schedule");
  }

  const [created] = await db
    .select()
    .from(EnrollmentTable)
    .where(eq(EnrollmentTable.id, id))
    .limit(1);
  return created!;
}
