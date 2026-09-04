"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { TeacherProfileTable } from "@/db/schema";
import { db } from "@/lib/db";
import { SessionNotesService } from "@/server/notes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

const createNoteSchema = z
  .object({
    note: z.string().min(1).max(5000),
    schedule_id: z.string().optional(),
    session_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .passthrough();

const updateNoteSchema = z
  .object({
    note: z.string().min(1).max(5000),
  })
  .passthrough();

/** Resolve the teacher profile id for the current user, or throw 403. */
async function requireTeacherProfileId(currentUserId: string, verb: string): Promise<string> {
  const teacherProfile = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, currentUserId))
    .limit(1);

  if (teacherProfile.length === 0) {
    throw new HttpError(403, "FORBIDDEN", `Only teachers can ${verb} session notes`);
  }
  return teacherProfile[0].id;
}

/**
 * POST /v1/students/:studentId/notes — create a session note (teacher).
 */
export async function createNote(
  studentId: string,
  input: { note: string; schedule_id?: string; session_date?: string },
) {
  const currentUser = await requireRole("teacher");
  const parsed = createNoteSchema.parse(input);

  const teacherId = await requireTeacherProfileId(currentUser.id, "create");

  return await new SessionNotesService().create({
    student_id: studentId,
    teacher_id: teacherId,
    schedule_id: parsed.schedule_id,
    session_date: parsed.session_date,
    note: parsed.note,
  });
}

/**
 * PATCH /v1/notes/:id — update a note (teacher; must own the note).
 */
export async function updateNote(id: string, input: { note: string }) {
  const currentUser = await requireRole("teacher");
  const parsed = updateNoteSchema.parse(input);

  const teacherId = await requireTeacherProfileId(currentUser.id, "update");

  const note = await new SessionNotesService().update(id, teacherId, parsed.note);
  if (!note) {
    throw new NotFoundError("Note not found or you don't have permission to update it");
  }
  return note;
}

/**
 * DELETE /v1/notes/:id — delete a note (administrator | teacher; teachers
 * must own the note).
 */
export async function deleteNote(id: string) {
  const currentUser = await requireRole("administrator", "teacher");

  let teacherId: string | undefined;
  if (currentUser.role !== "administrator") {
    teacherId = await requireTeacherProfileId(currentUser.id, "delete");
  }

  const deleted = await new SessionNotesService().delete(id, teacherId);
  if (!deleted) {
    throw new NotFoundError("Note not found or you don't have permission to delete it");
  }
  return { success: true };
}
