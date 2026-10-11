import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  type SessionNoteEntity,
  type SessionNoteInsert,
  SessionNoteTable,
  StudentTable,
  TeacherProfileTable,
} from "@/_platform/db/schema";
import { NotFoundError } from "@/_shared/server/errors";

import type { CreateSessionNoteInput } from "../_domain/types";

export async function create(input: CreateSessionNoteInput): Promise<SessionNoteEntity> {
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

  const newNote: SessionNoteInsert = {
    student_id: input.student_id,
    teacher_id: input.teacher_id,
    schedule_id: input.schedule_id || null,
    session_date: input.session_date || null,
    note: input.note,
  };
  const result = await db.insert(SessionNoteTable).values(newNote).returning();

  return result[0]!;
}
