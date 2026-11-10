"use server";

import { assertTeacherAssignedToStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";

import { requireTeacherProfileId } from "../_teacher/access";
import { create } from "./service";
import { createNoteSchema } from "./validation";

export async function createNote(
  studentId: string,
  input: { note: string; schedule_id?: string; session_date?: string },
) {
  const currentUser = await requireRole("teacher");
  const parsed = createNoteSchema.parse(input);

  const teacherId = await requireTeacherProfileId(currentUser.id, "create");
  await assertTeacherAssignedToStudent(currentUser.id, studentId);

  return await create({
    student_id: studentId,
    teacher_id: teacherId,
    schedule_id: parsed.schedule_id,
    session_date: parsed.session_date,
    note: parsed.note,
  });
}
