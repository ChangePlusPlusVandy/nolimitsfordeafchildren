"use server";

import { requireRole } from "@/_platform/auth/guard";
import { HttpError } from "@/_shared/server/errors";

import { isTeacherAuthorizedForSession, listSessionsForTeacher } from "./service";

export async function listTeacherMakeupSessions(
  teacherId: string,
  query: { date?: string; page?: number; limit?: number } = {},
) {
  const currentUser = await requireRole("administrator", "teacher");

  if (currentUser.role === "teacher") {
    const canView = await isTeacherAuthorizedForSession(currentUser.id, teacherId);
    if (!canView) {
      throw new HttpError(403, "FORBIDDEN", "You can only view your own makeup sessions");
    }
  }

  return await listSessionsForTeacher(teacherId, query);
}

export async function listMakeupSessionsForTeacher(
  teacherId: string,
  query: { date?: string; page?: number; limit?: number } = {},
) {
  return await listTeacherMakeupSessions(teacherId, query);
}
