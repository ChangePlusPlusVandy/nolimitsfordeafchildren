import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  LocationTable,
  MakeupRequestTable,
  MakeupSessionTable,
  StudentTable,
  TeacherProfileTable,
  type MakeupSessionEntity,
  type MakeupSessionInsert,
} from "@/_platform/db/schema";
import { NotFoundError } from "@/_shared/server/errors";

import type { CreateMakeupSessionInput } from "./types";

export async function createSession(input: CreateMakeupSessionInput): Promise<MakeupSessionEntity> {
  const student = await db
    .select()
    .from(StudentTable)
    .where(eq(StudentTable.id, input.student_id))
    .limit(1);

  if (student.length === 0) {
    throw new NotFoundError("Student not found");
  }

  const teacher = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.id, input.teacher_id))
    .limit(1);

  if (teacher.length === 0) {
    throw new NotFoundError("Teacher not found");
  }

  const site = await db
    .select()
    .from(LocationTable)
    .where(eq(LocationTable.id, input.site_id))
    .limit(1);

  if (site.length === 0) {
    throw new NotFoundError("Site not found");
  }

  const newSession: MakeupSessionInsert = {
    makeup_request_id: input.makeup_request_id || null,
    student_id: input.student_id,
    teacher_id: input.teacher_id,
    site_id: input.site_id,
    scheduled_date: input.scheduled_date,
    scheduled_time: input.scheduled_time,
    notes: input.notes || null,
    created_by: input.created_by,
  };

  const result = await db.insert(MakeupSessionTable).values(newSession).returning();

  // Scheduling completes the linked request.
  if (input.makeup_request_id) {
    await db
      .update(MakeupRequestTable)
      .set({
        status: "completed",
        updated_at: new Date(),
      })
      .where(eq(MakeupRequestTable.id, input.makeup_request_id));
  }

  return result[0]!;
}
