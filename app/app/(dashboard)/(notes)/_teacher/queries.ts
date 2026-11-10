"use server";

import { getTeacherProfileIdForUser } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { ForbiddenError } from "@/_shared/server/errors";

import { listByTeacher } from "./service";

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
  return await listByTeacher(teacherId, query);
}
