"use server";
import { sessionNotesService } from "@/server/notes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError, NotFoundError } from "@/server/shared/errors";
import { assertCanAccessStudent, getTeacherProfileIdForUser } from "@/server/shared/student-access";

export async function listStudentNotes(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher", "parent");
  await assertCanAccessStudent(user, studentId);
  return await sessionNotesService.listForStudent(studentId, query);
}

export async function listNotesForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentNotes(studentId, query);
}

export async function getNote(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const note = await sessionNotesService.show(id);
  if (!note) {
    throw new NotFoundError("Note not found");
  }
  await assertCanAccessStudent(user, note.student_id);
  return note;
}

export async function listTeacherNotes(
  teacherId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher");
  if (user.role === "teacher") {
    const profileId = await getTeacherProfileIdForUser(user.id);
    if (profileId !== teacherId) {
      throw new ForbiddenError("You can only list your own session notes");
    }
  }
  return await sessionNotesService.listByTeacher(teacherId, query);
}
