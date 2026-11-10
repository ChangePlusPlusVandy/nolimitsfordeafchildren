"use server";

import { assertCanAccessStudent } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { show } from "./service";

export async function getNote(id: string) {
  const user = await requireRole("administrator", "teacher", "parent");
  const note = await show(id);
  if (!note) {
    throw new NotFoundError("Note not found");
  }
  await assertCanAccessStudent(user, note.student_id);
  return note;
}
