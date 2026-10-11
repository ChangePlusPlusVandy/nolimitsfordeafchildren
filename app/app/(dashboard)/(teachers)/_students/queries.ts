"use server";

import { getTeacherProfileIdForUser } from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { ForbiddenError, NotFoundError } from "@/_shared/server/errors";

import { resolveTeacherProfileId } from "../_resolve/service";
import { getTeacherStudents as students } from "./service";

export async function getTeacherStudents(
  id: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole("administrator", "teacher");
  const profileId = await resolveTeacherProfileId(id);
  if (!profileId) {
    throw new NotFoundError("Teacher not found");
  }
  if (user.role === "teacher") {
    const callerProfileId = await getTeacherProfileIdForUser(user.id);
    if (callerProfileId !== profileId) {
      throw new ForbiddenError("You can only list your assigned students");
    }
  }
  return await students(profileId, query);
}
