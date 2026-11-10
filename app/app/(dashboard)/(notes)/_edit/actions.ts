"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { requireTeacherProfileId } from "../_teacher/access";
import { update } from "./service";
import { updateNoteSchema } from "./validation";

export async function updateNote(id: string, input: { note: string }) {
  const currentUser = await requireRole("teacher");
  const parsed = updateNoteSchema.parse(input);

  const teacherId = await requireTeacherProfileId(currentUser.id, "update");

  const note = await update(id, teacherId, parsed.note);
  if (!note) {
    throw new NotFoundError("Note not found or you don't have permission to update it");
  }
  return note;
}
