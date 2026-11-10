import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  SessionNoteTable,
  StudentTable,
  TeacherProfileTable,
  UserTable,
} from "@/_platform/db/schema";

import type { SessionNoteWithDetails } from "../_domain/types";

export async function show(id: string): Promise<SessionNoteWithDetails | null> {
  const results = await db
    .select({
      id: SessionNoteTable.id,
      student_id: SessionNoteTable.student_id,
      teacher_id: SessionNoteTable.teacher_id,
      schedule_id: SessionNoteTable.schedule_id,
      session_date: SessionNoteTable.session_date,
      note: SessionNoteTable.note,
      created_at: SessionNoteTable.created_at,
      updated_at: SessionNoteTable.updated_at,
      teacher_name: UserTable.name,
      student_initials: StudentTable.initials,
      student_first_name: StudentTable.first_name,
      student_last_name: StudentTable.last_name,
    })
    .from(SessionNoteTable)
    .innerJoin(TeacherProfileTable, eq(SessionNoteTable.teacher_id, TeacherProfileTable.id))
    .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
    .innerJoin(StudentTable, eq(SessionNoteTable.student_id, StudentTable.id))
    .where(eq(SessionNoteTable.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0]!;
  return {
    id: row.id,
    student_id: row.student_id,
    teacher_id: row.teacher_id,
    schedule_id: row.schedule_id,
    session_date: row.session_date,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    teacher: { id: row.teacher_id, name: row.teacher_name },
    student: {
      id: row.student_id,
      initials: row.student_initials,
      first_name: row.student_first_name,
      last_name: row.student_last_name,
    },
  };
}
