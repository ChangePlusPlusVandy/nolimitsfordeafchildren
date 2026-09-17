"use server";
import { sessionNotesService } from "@/server/notes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/students/:studentId/notes — administrator | teacher | parent.
 */
export async function listStudentNotes(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  await requireRole("administrator", "teacher", "parent");
  return await sessionNotesService.listForStudent(studentId, query);
}

/**
 * Client-facing alias (src/client/notes.ts imports this name).
 */
export async function listNotesForStudent(
  studentId: string,
  query: { page?: number; limit?: number } = {},
) {
  return await listStudentNotes(studentId, query);
}

/**
 * GET /v1/notes/:id — administrator | teacher | parent.
 */
export async function getNote(id: string) {
  await requireRole("administrator", "teacher", "parent");
  const note = await sessionNotesService.show(id);
  if (!note) {
    throw new NotFoundError("Note not found");
  }
  return note;
}

/**
 * GET /v1/teachers/:teacherId/notes — administrator | teacher.
 */
export async function listTeacherNotes(
  teacherId: string,
  query: { page?: number; limit?: number } = {},
) {
  await requireRole("administrator", "teacher");
  return await sessionNotesService.listByTeacher(teacherId, query);
}
