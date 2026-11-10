"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { requireTeacherProfileId } from "../_teacher/access";
import { deleteNote as remove } from "./service";

export async function deleteNote(id: string) {
  const currentUser = await requireRole("administrator", "teacher");

  let teacherId: string | undefined;
  if (currentUser.role !== "administrator") {
    teacherId = await requireTeacherProfileId(currentUser.id, "delete");
  }

  const deleted = await remove(id, teacherId);
  if (!deleted) {
    throw new NotFoundError("Note not found or you don't have permission to delete it");
  }
  return { success: true };
}
