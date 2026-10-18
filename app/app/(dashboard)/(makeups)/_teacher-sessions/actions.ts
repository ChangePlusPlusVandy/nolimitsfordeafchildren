"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { assertTeacherOwnsMakeupSession, markSessionAttendance } from "./service";
import { markAttendanceSchema } from "./validation";

export async function markMakeupSessionAttendance(
  id: string,
  input: { status: "present" | "late" | "no_show" | "cancelled" },
) {
  const currentUser = await requireRole("administrator", "teacher");
  const parsed = markAttendanceSchema.parse(input);

  if (currentUser.role === "teacher") {
    await assertTeacherOwnsMakeupSession(currentUser.id, id);
  }

  const session = await markSessionAttendance(id, parsed.status);
  if (!session) {
    throw new NotFoundError("Makeup session not found");
  }
  return session;
}
